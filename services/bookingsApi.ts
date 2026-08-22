import { db } from "@/services/firebaseConfig";
import { Booking } from "@/types";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

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
