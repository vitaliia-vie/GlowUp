import { db } from "@/services/firebaseConfig";
import { Availability, WorkingHours } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AVAILABILITY_COLLECTION = "availability";

// Default schedule used until a master configures their own: Mon–Fri, 9:00–18:00
const DEFAULT_WORKING_HOURS: WorkingHours[] = [0, 1, 2, 3, 4, 5, 6].map(
  (dayOfWeek) => ({
    dayOfWeek,
    isWorking: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: "09:00",
    endTime: "18:00",
  }),
);

export async function getAvailability(masterId: string): Promise<Availability> {
  const snap = await getDoc(doc(db, AVAILABILITY_COLLECTION, masterId));

  if (snap.exists()) {
    return snap.data() as Availability;
  }

  return {
    masterId,
    workingHours: DEFAULT_WORKING_HOURS,
    exceptions: [],
  };
}

export async function setAvailability(
  masterId: string,
  data: Omit<Availability, "masterId">,
): Promise<void> {
  await setDoc(doc(db, AVAILABILITY_COLLECTION, masterId), {
    ...data,
    masterId,
  });
}

// Generates time slots (e.g. every 30 min) between start and end for a working day
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  stepMinutes = 30,
): string[] {
  const slots: string[] = [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += stepMinutes;
  }

  return slots;
}
