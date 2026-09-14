import { db } from "@/services/firebaseConfig";
import { createNotification } from "@/services/notificationsApi";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
} from "firebase/firestore";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
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
    { lastMessage: text, lastMessageAt: serverTimestamp() },
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

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ChatMessage, "id">),
    }));
    onMessages(messages);
  });
}
