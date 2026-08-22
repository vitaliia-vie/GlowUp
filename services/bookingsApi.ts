import { db } from "@/services/firebaseConfig";
import { Booking, BookingStatus } from "@/types";
import {
  addDoc,
  collection,
  doc,
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
  return docRef.id;
}
// Returns all non-cancelled bookings for a given master on a given date
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
// Returns every booking a client has made, newest first
export async function getBookingsByClient(
  clientId: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where("clientId", "==", clientId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Booking, "id">),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
// Returns every booking request a master has received, newest first
export async function getBookingsForMaster(
  masterId: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where("masterId", "==", masterId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Booking, "id">),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), { status });
}
