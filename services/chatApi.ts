import { db } from "@/services/firebaseConfig";
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

// chatId is always "{clientId}_{masterId}"
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
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: Date.now(),
  });

  // Update last message preview on the chat doc
  await setDoc(
    doc(db, "chats", chatId),
    { lastMessage: text, lastMessageAt: serverTimestamp() },
    { merge: true },
  );
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
