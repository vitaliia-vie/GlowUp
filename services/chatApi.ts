import { db } from "@/services/firebaseConfig";
import { createNotification } from "@/services/notificationsApi";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from "firebase/firestore";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface ChatSummary {
  id: string;
  clientId: string;
  clientName: string;
  masterId: string;
  masterName: string;
  lastMessage: string;
  lastMessageAt: number;
  lastSenderId?: string;
  // The last message is from the other person and not opened yet
  unread: boolean;
}

export function getChatId(clientId: string, masterId: string): string {
  return `${clientId}_${masterId}`;
}

export async function ensureChatExists(
  clientId: string,
  clientName: string,
  masterId: string,
  masterName: string,
): Promise<string> {
  const chatId = getChatId(clientId, masterId);
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      clientId,
      clientName,
      masterId,
      masterName,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    });
  }

  return chatId;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
): Promise<void> {
  // chatId формат: {clientId}_{masterId}
  const [clientId, masterId] = chatId.split("_");

  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: Date.now(),
  });

  // Обновляем превью последнего сообщения
  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastMessageAtMs: Date.now(),
      lastMessageSenderId: senderId,
    },
    { merge: true },
  );

  // Уведомление получателю — не самому отправителю
  const recipientId = senderId === clientId ? masterId : clientId;

  await createNotification({
    userId: recipientId,
    type: "new_message",
    title: `New message from ${senderName}`,
    body: text.length > 60 ? text.slice(0, 60) + "..." : text,
    relatedId: chatId,
  });
}

export function subscribeToMessages(
  chatId: string,
  onMessages: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatMessage, "id">),
      }));
      onMessages(messages);
    },
    (error) => {
      // Expected for a moment when the user signs out or switches account
      if (error.code !== "permission-denied") {
        console.warn("Messages listener error:", error.message);
      }
      onMessages([]);
    },
  );
}

// Remembers when this user last had the chat open (drives the unread dot)
export async function markChatRead(
  chatId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), {
    [`lastRead.${userId}`]: Date.now(),
  });
}

// All chats the user takes part in, as a client or as a master
export function subscribeToChats(
  userId: string,
  onChats: (chats: ChatSummary[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    or(where("clientId", "==", userId), where("masterId", "==", userId)),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: ChatSummary[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data({ serverTimestamps: "estimate" });
        const lastRead: Record<string, number> = data.lastRead ?? {};
        const lastMessageAtMs: number = data.lastMessageAtMs ?? 0;
        const senderId: string | undefined = data.lastMessageSenderId;

        return {
          id: docSnap.id,
          clientId: data.clientId,
          clientName: data.clientName,
          masterId: data.masterId,
          masterName: data.masterName,
          lastMessage: data.lastMessage ?? "",
          lastMessageAt: data.lastMessageAt?.toMillis?.() ?? lastMessageAtMs,
          lastSenderId: senderId,
          unread:
            Boolean(senderId) &&
            senderId !== userId &&
            lastMessageAtMs > (lastRead[userId] ?? 0),
        };
      });
      onChats(chats);
    },
    (error) => {
      if (error.code !== "permission-denied") {
        console.warn("Chats listener error:", error.message);
      }
      onChats([]);
    },
  );
}