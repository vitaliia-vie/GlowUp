import { db } from "@/services/firebaseConfig";
import { createNotification } from "@/services/notificationsApi";
import { Booking, BookingStatus } from "@/types";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const BOOKINGS_COLLECTION = "bookings";

export async function createBooking(
  data: Omit<Booking, "id" | "status" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  });

  // Уведомление мастеру — новая запись
  await createNotification({
    userId: data.masterId,
    type: "new_booking",
    title: "New booking request",
    body: `A client wants to book ${data.date} at ${data.timeSlot}`,
    relatedId: docRef.id,
  });

  return docRef.id;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  await updateDoc(bookingRef, { status });

  // Уведомление клиенту — статус изменился
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) return;
  const booking = snap.data() as Booking;

  if (status === "confirmed") {
    await createNotification({
      userId: booking.clientId,
      type: "booking_confirmed",
      title: "Booking confirmed! ✓",
      body: `Your appointment on ${booking.date} at ${booking.timeSlot} is confirmed`,
      relatedId: bookingId,
    });
  } else if (status === "cancelled") {
    await createNotification({
      userId: booking.clientId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      body: `Your appointment on ${booking.date} at ${booking.timeSlot} was cancelled`,
      relatedId: bookingId,
    });
  }
}

export async function getBookingsForMasterOnDate(
  masterId: string,
  date: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where("masterId", "==", masterId),
    where("date", "==", date),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Booking, "id">),
    }))
    .filter((booking) => booking.status !== "cancelled");
}

export async function getBookingsByClient(
  clientId: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where("clientId", "==", clientId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Booking, "id">),
  }));
}

export async function getBookingsForMaster(
  masterId: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where("masterId", "==", masterId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Booking, "id">),
  }));
}
