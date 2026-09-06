import { db } from "@/services/firebaseConfig";
import { UserProfile } from "@/types";
import { doc, updateDoc } from "firebase/firestore";

export async function updateProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "displayName" | "specialization" | "phone">>,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}
