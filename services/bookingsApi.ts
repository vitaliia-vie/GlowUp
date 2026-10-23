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

  await createNotification({
    userId: data.masterId,
    type: "new_booking",
    title: "New booking request",
    body: `A client wants to book ${data.date} at ${data.timeSlot}`,
    relatedId: docRef.id,
  });

  return docRef.id;
}

export async function getBookingById(
  bookingId: string,
): Promise<Booking | null> {
  const snap = await getDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<Booking, "id">) }
    : null;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  await updateDoc(bookingRef, { status });

  const snap = await getDoc(bookingRef);
  if (!snap.exists()) return;
  const booking = snap.data() as Booking;

  if (status === "confirmed") {
    await createNotification({
      userId: booking.clientId,
      type: "booking_confirmed",
      title: "Booking confirmed",
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
  } else if (status === "completed") {
    await createNotification({
      userId: booking.clientId,
      type: "booking_completed",
      title: "How was your visit?",
      body: "Leave a review to help others choose the right master",
      relatedId: bookingId,
    });
  }
}

// Cancels with a reason and notifies the OTHER side of the booking
export async function cancelBooking(
  bookingId: string,
  cancelledBy: "client" | "master",
  reason: string,
  actorName: string,
): Promise<void> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  await updateDoc(bookingRef, {
    status: "cancelled",
    cancelledBy,
    cancelReason: reason,
  });

  const snap = await getDoc(bookingRef);
  if (!snap.exists()) return;
  const booking = snap.data() as Booking;
  const clientCancelled = cancelledBy === "client";

  await createNotification({
    userId: clientCancelled ? booking.masterId : booking.clientId,
    type: "booking_cancelled",
    title: clientCancelled ? "Booking cancelled by client" : "Booking cancelled",
    body: `${actorName} cancelled the appointment on ${booking.date} at ${booking.timeSlot}. Reason: ${reason}`,
    relatedId: bookingId,
  });
}

// Moves a booking to a new time. It goes back to "pending" because the
// master has to confirm the new time.
export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newTimeSlot: string,
  reason: string,
  actorName: string,
): Promise<void> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("This booking no longer exists.");
  const booking = snap.data() as Booking;

  const sameDay = await getBookingsForMasterOnDate(booking.masterId, newDate);
  if (sameDay.some((b) => b.timeSlot === newTimeSlot && b.id !== bookingId)) {
    throw new Error("This time was just taken. Please choose another one.");
  }

  await updateDoc(bookingRef, {
    date: newDate,
    timeSlot: newTimeSlot,
    status: "pending",
    rescheduledFrom: { date: booking.date, timeSlot: booking.timeSlot },
    rescheduleReason: reason,
  });

  await createNotification({
    userId: booking.masterId,
    type: "booking_rescheduled",
    title: "Booking moved",
    body: `${actorName} wants to move the appointment from ${booking.date} at ${booking.timeSlot} to ${newDate} at ${newTimeSlot}.${reason ? ` Reason: ${reason}` : ""}`,
    relatedId: bookingId,
  });
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