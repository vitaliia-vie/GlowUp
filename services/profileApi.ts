import { db } from "@/services/firebaseConfig";
import { UserProfile } from "@/types";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";

export async function updateProfile(
  uid: string,
  data: Partial<
    Pick<
      UserProfile,
      "displayName" | "specialization" | "phone" | "instagram" | "avatarUrl"
    >
  >,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

export async function setFavoriteMaster(
  uid: string,
  masterId: string,
  favorite: boolean,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    favoriteMasterIds: favorite ? arrayUnion(masterId) : arrayRemove(masterId),
  });
}