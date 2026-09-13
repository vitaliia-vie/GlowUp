import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBookingsForMaster,
  updateBookingStatus,
} from "@/services/bookingsApi";
import { getMasterProfile } from "@/services/mastersApi";
import { getServiceById } from "@/services/servicesApi";
import { Booking, BookingStatus } from "@/types";
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

export default function MasterBookingsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    try {
      await updateBookingStatus(booking.id, status);
      loadBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to update booking.");
    }
  };

  const handleDecline = (booking: BookingRow) => {
    Alert.alert(
      "Decline booking",
      `Decline ${booking.clientName}'s request for ${booking.serviceName}?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => respond(booking, "cancelled"),
        },
      ],
    );
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
        renderItem={({ item }) => (
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

            <View style={styles.actionsRow}>
              {item.status === "pending" && (
                <>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => respond(item, "confirmed")}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(item)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </>
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
                <Text style={styles.chatButtonText}>✉ Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
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
