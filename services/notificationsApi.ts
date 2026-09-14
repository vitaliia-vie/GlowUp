import { db } from "@/services/firebaseConfig";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    Unsubscribe,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

export type NotificationType =
  | "new_booking"
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_message";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: number;
}

const COL = "notifications";

export async function createNotification(
  data: Omit<AppNotification, "id" | "isRead" | "createdAt">,
): Promise<void> {
  await addDoc(collection(db, COL), {
    ...data,
    isRead: false,
    createdAt: Date.now(),
  });
}

export function subscribeToNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    const items: AppNotification[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AppNotification, "id">),
    }));
    onData(items);
  });
}

export async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, COL, notificationId), { isRead: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    where("isRead", "==", false),
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isRead: true });
  });
  await batch.commit();
}
