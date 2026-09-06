import { db } from "@/services/firebaseConfig";
import { PortfolioItem } from "@/types";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from "firebase/firestore";

const PORTFOLIO_COLLECTION = "portfolio";

export async function addPortfolioPhoto(
  masterId: string,
  imageUrl: string,
  caption?: string,
): Promise<PortfolioItem> {
  const docRef = await addDoc(collection(db, PORTFOLIO_COLLECTION), {
    masterId,
    imageUrl,
    caption: caption ?? "",
    createdAt: Date.now(),
  });

  return {
    id: docRef.id,
    masterId,
    imageUrl,
    caption,
    createdAt: Date.now(),
  };
}

export async function getPortfolioByMaster(
  masterId: string,
): Promise<PortfolioItem[]> {
  const q = query(
    collection(db, PORTFOLIO_COLLECTION),
    where("masterId", "==", masterId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<PortfolioItem, "id">),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePortfolioPhoto(photoId: string): Promise<void> {
  await deleteDoc(doc(db, PORTFOLIO_COLLECTION, photoId));
}
