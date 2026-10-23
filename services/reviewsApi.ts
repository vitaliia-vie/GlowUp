import { db } from "@/services/firebaseConfig";
import { createNotification } from "@/services/notificationsApi";
import { Review } from "@/types";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

const REVIEWS_COLLECTION = "reviews";

export async function createReview(
  data: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
  const review: Review = {
    ...data,
    id: data.bookingId, // one review per booking
    createdAt: Date.now(),
  };

  await setDoc(doc(db, REVIEWS_COLLECTION, review.id), review);

  // Telling the master is nice to have: a failure here must not lose the review
  try {
    await createNotification({
      userId: data.masterId,
      type: "new_review",
      title: `New ${data.rating}★ review`,
      body: data.comment
        ? `${data.clientName}: ${data.comment.slice(0, 60)}`
        : `${data.clientName} rated ${data.serviceName}`,
      relatedId: data.masterId,
    });
  } catch {}

  return review;
}

export async function getReviewsByMaster(masterId: string): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where("masterId", "==", masterId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => docSnap.data() as Review)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getReviewsByClient(clientId: string): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where("clientId", "==", clientId),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => docSnap.data() as Review);
}

export function summarizeReviews(reviews: Review[]): {
  average: number;
  count: number;
} {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: total / reviews.length, count: reviews.length };
}