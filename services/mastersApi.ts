import { db } from "@/services/firebaseConfig";
import { Service, ServiceCategory, UserProfile } from "@/types";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";

// Get all users with role 'master'
export async function getAllMasters(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", "master"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => docSnap.data() as UserProfile);
}

// Get masters who offer at least one service in the given category
export async function getMastersByCategory(
  category: ServiceCategory,
): Promise<UserProfile[]> {
  const servicesQuery = query(
    collection(db, "services"),
    where("category", "==", category),
  );
  const servicesSnapshot = await getDocs(servicesQuery);

  const masterIds = Array.from(
    new Set(
      servicesSnapshot.docs.map(
        (docSnap) => (docSnap.data() as Service).masterId,
      ),
    ),
  );

  if (masterIds.length === 0) return [];

  const masters = await Promise.all(
    masterIds.map((id) => getDoc(doc(db, "users", id))),
  );

  return masters
    .filter((snap) => snap.exists())
    .map((snap) => snap.data() as UserProfile);
}

export async function getMasterProfile(
  masterId: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", masterId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
