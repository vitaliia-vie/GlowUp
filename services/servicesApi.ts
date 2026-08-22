import { db } from "@/services/firebaseConfig";
import { Service } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
const SERVICES_COLLECTION = "services";
export async function addService(
  masterId: string,
  data: Omit<Service, "id" | "masterId">,
): Promise<string> {
  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
    ...data,
    masterId,
  });
  return docRef.id;
}
export async function getServicesByMaster(
  masterId: string,
): Promise<Service[]> {
  const q = query(
    collection(db, SERVICES_COLLECTION),
    where("masterId", "==", masterId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Service, "id">),
  }));
}
export async function getServiceById(
  serviceId: string,
): Promise<Service | null> {
  const snap = await getDoc(doc(db, SERVICES_COLLECTION, serviceId));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<Service, "id">) }
    : null;
}
export async function updateService(
  serviceId: string,
  data: Partial<Omit<Service, "id" | "masterId">>,
): Promise<void> {
  await updateDoc(doc(db, SERVICES_COLLECTION, serviceId), data);
}
export async function deleteService(serviceId: string): Promise<void> {
  await deleteDoc(doc(db, SERVICES_COLLECTION, serviceId));
}
