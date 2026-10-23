import ReviewModal from "@/components/ReviewModal";
import StarRating from "@/components/StarRating";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBookingsByClient,
  updateBookingStatus,
} from "@/services/bookingsApi";
import { getMasterProfile } from "@/services/mastersApi";
import { createReview, getReviewsByClient } from "@/services/reviewsApi";
import { getServiceById } from "@/services/servicesApi";
import { Booking, BookingStatus, Review } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BookingRow extends Booking {
  masterName: string;
  serviceName: string;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "#B08A2E",
  confirmed: "#2E8B57",
  cancelled: "#B3554A",
  completed: "#5C5854",
};

export default function ClientBookingsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviewsByBooking, setReviewsByBooking] = useState<
    Record<string, Review>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<BookingRow | null>(null);
  const [isSendingReview, setIsSendingReview] = useState(false);

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (!profile) return;
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const [raw, reviews] = await Promise.all([
          getBookingsByClient(profile.uid),
          getReviewsByClient(profile.uid),
        ]);

        const masterCache = new Map<string, string>();
        const serviceCache = new Map<string, string>();
        const rows = await Promise.all(
          raw.map(async (booking) => {
            if (!masterCache.has(booking.masterId)) {
              const master = await getMasterProfile(booking.masterId);
              masterCache.set(
                booking.masterId,
                master?.displayName ?? "Unknown master",
              );
            }
            if (!serviceCache.has(booking.serviceId)) {
              const service = await getServiceById(booking.serviceId);
              serviceCache.set(
                booking.serviceId,
                service?.title ?? "Deleted service",
              );
            }
            return {
              ...booking,
              masterName: masterCache.get(booking.masterId)!,
              serviceName: serviceCache.get(booking.serviceId)!,
            };
          }),
        );

        const map: Record<string, Review> = {};
        reviews.forEach((review) => {
          map[review.bookingId] = review;
        });

        setBookings(rows);
        setReviewsByBooking(map);
      } catch (error: any) {
        Alert.alert("Error", error.message ?? "Failed to load your bookings.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [profile],
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = (booking: BookingRow) => {
    Alert.alert(
      "Cancel booking",
      `Cancel your ${booking.serviceName} appointment with ${booking.masterName} on ${booking.date} at ${booking.timeSlot}?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await updateBookingStatus(booking.id, "cancelled");
              loadBookings();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message ?? "Failed to cancel booking.",
              );
            }
          },
        },
      ],
    );
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!profile || !reviewTarget) return;
    setIsSendingReview(true);
    try {
      const review = await createReview({
        bookingId: reviewTarget.id,
        masterId: reviewTarget.masterId,
        clientId: profile.uid,
        clientName: profile.displayName,
        serviceName: reviewTarget.serviceName,
        rating,
        comment,
      });
      setReviewsByBooking((prev) => ({ ...prev, [review.bookingId]: review }));
      setReviewTarget(null);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Could not send your review.");
    } finally {
      setIsSendingReview(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadBookings(true)}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven't booked anything yet.</Text>
        }
        renderItem={({ item }) => {
          const review = reviewsByBooking[item.id];

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    { color: STATUS_COLOR[item.status] },
                  ]}
                >
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
              <Text style={styles.masterName}>with {item.masterName}</Text>
              <Text style={styles.dateTime}>
                {item.date} · {item.timeSlot}
              </Text>

              {(item.status === "pending" || item.status === "confirmed") && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancel(item)}
                >
                  <Text style={styles.cancelButtonText}>Cancel booking</Text>
                </TouchableOpacity>
              )}

              {item.status === "completed" &&
                (review ? (
                  <View style={styles.reviewBox}>
                    <Text style={styles.reviewLabel}>Your review</Text>
                    <StarRating value={review.rating} size={16} />
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => setReviewTarget(item)}
                  >
                    <Text style={styles.reviewButtonText}>Leave a review</Text>
                  </TouchableOpacity>
                ))}
            </View>
          );
        }}
      />

      <ReviewModal
        visible={reviewTarget !== null}
        masterName={reviewTarget?.masterName ?? ""}
        serviceName={reviewTarget?.serviceName ?? ""}
        isSubmitting={isSendingReview}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleSubmitReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  statusBadge: { fontSize: 12, fontWeight: "700" },
  masterName: { color: colors.textSecondary, marginTop: 2 },
  dateTime: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  cancelButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: { color: colors.danger, fontWeight: "600", fontSize: 13 },
  reviewButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  reviewButtonText: {
    color: colors.accentText,
    fontWeight: "600",
    fontSize: 13,
  },
  reviewBox: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  reviewLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  reviewComment: { fontSize: 13, color: colors.textPrimary },
});