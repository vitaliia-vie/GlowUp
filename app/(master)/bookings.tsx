import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBookingsForMaster,
  updateBookingStatus,
} from "@/services/bookingsApi";
import { getMasterProfile } from "@/services/mastersApi";
import { getServiceById } from "@/services/servicesApi";
import { Booking, BookingStatus } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  clientName: string;
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

// Local date as YYYY-MM-DD (matches the phone's clock, not UTC)
function todayLocalIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// Firestore writes never fail while the connection is down, they just wait.
// This turns a silent hang into a visible error.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "The server did not answer in time. Check your internet connection and try again.",
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Shows the app's own confirmation dialog (see components/DialogHost.tsx)
function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  destructive = false,
) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}

export default function MasterBookingsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Booking that is being updated right now (disables its buttons)
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (!profile) return;
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const raw = await getBookingsForMaster(profile.uid);
        const clientCache = new Map<string, string>();
        const serviceCache = new Map<string, string>();
        const rows = await Promise.all(
          raw.map(async (booking) => {
            if (!clientCache.has(booking.clientId)) {
              const client = await getMasterProfile(booking.clientId);
              clientCache.set(
                booking.clientId,
                client?.displayName ?? "Unknown client",
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
              clientName: clientCache.get(booking.clientId)!,
              serviceName: serviceCache.get(booking.serviceId)!,
            };
          }),
        );
        setBookings(rows);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.message ?? "Failed to load booking requests.",
        );
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

  const respond = async (booking: BookingRow, status: BookingStatus) => {
    setBusyId(booking.id);
    try {
      await withTimeout(updateBookingStatus(booking.id, status), 12000);
      // Update this card right away instead of reloading the whole list
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status } : b)),
      );
    } catch (error: any) {
      console.warn("Booking status update failed:", error);
      Alert.alert("Error", error.message ?? "Failed to update booking.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = (booking: BookingRow) => {
    confirmAction(
      "Decline booking",
      `Decline ${booking.clientName}'s request for ${booking.serviceName}?`,
      "Decline",
      () => respond(booking, "cancelled"),
      true,
    );
  };

  const handleComplete = (booking: BookingRow) => {
    confirmAction(
      "Mark as completed",
      `${booking.clientName}'s visit is done? They will be asked to leave a review.`,
      "Completed",
      () => respond(booking, "completed"),
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const today = todayLocalIso();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Booking Requests</Text>
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
          <Text style={styles.emptyText}>No booking requests yet.</Text>
        }
        renderItem={({ item }) => {
          const isBusy = busyId === item.id;

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
              <Text style={styles.clientName}>for {item.clientName}</Text>
              <Text style={styles.dateTime}>
                {item.date} · {item.timeSlot}
              </Text>

              {item.status === "pending" && item.rescheduledFrom && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>
                    Moved from {item.rescheduledFrom.date} ·{" "}
                    {item.rescheduledFrom.timeSlot}
                  </Text>
                  {item.rescheduleReason ? (
                    <Text style={styles.noteText}>{item.rescheduleReason}</Text>
                  ) : null}
                </View>
              )}

              {item.status === "cancelled" && item.cancelledBy === "client" && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Cancelled by the client</Text>
                  {item.cancelReason ? (
                    <Text style={styles.noteText}>{item.cancelReason}</Text>
                  ) : null}
                </View>
              )}

              <View style={styles.actionsRow}>
                {item.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[styles.confirmButton, isBusy && styles.disabled]}
                      onPress={() => respond(item, "confirmed")}
                      disabled={isBusy}
                    >
                      <Text style={styles.confirmButtonText}>
                        {isBusy ? "Saving..." : "Confirm"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.declineButton, isBusy && styles.disabled]}
                      onPress={() => handleDecline(item)}
                      disabled={isBusy}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.status === "confirmed" && item.date <= today && (
                  <TouchableOpacity
                    style={[styles.confirmButton, isBusy && styles.disabled]}
                    onPress={() => handleComplete(item)}
                    disabled={isBusy}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isBusy ? "Saving..." : "Mark completed"}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => {
                    router.push({
                      pathname: "/(master)/chat/[clientId]" as any,
                      params: {
                        clientId: item.clientId,
                        clientName: item.clientName,
                      },
                    });
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
  clientName: { color: colors.textSecondary, marginTop: 2 },
  dateTime: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  noteBox: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  noteTitle: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  noteText: { fontSize: 13, color: colors.textSecondary },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  disabled: { opacity: 0.5 },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    color: colors.accentText,
    fontWeight: "600",
    fontSize: 13,
  },
  declineButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  declineButtonText: { color: colors.danger, fontWeight: "600", fontSize: 13 },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  chatButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
});