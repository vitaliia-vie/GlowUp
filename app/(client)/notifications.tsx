import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
    AppNotification,
    markAllAsRead,
    markAsRead,
    subscribeToNotifications,
} from "@/services/notificationsApi";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TYPE_ICON: Record<AppNotification["type"], string> = {
  new_booking: "📅",
  booking_confirmed: "✅",
  booking_cancelled: "❌",
  new_message: "✉️",
};

export default function ClientNotificationsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToNotifications(profile.uid, (data) => {
      setNotifications(data);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [profile]);

  const handleTap = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.type === "new_message" && notification.relatedId) {
      const masterId = notification.relatedId.split("_")[1];
      // @ts-ignore
      router.push({
        pathname: "/(client)/chat/[masterId]",
        params: { masterId },
      });
    } else if (
      notification.type === "booking_confirmed" ||
      notification.type === "booking_cancelled"
    ) {
      router.push("/(client)/bookings");
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    await markAllAsRead(profile.uid);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handleTap(item)}
          >
            <Text style={styles.icon}>{TYPE_ICON[item.type]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  header: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  markAllRead: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardUnread: { borderColor: colors.accent, backgroundColor: "#FAF9F6" },
  icon: { fontSize: 24, marginTop: 2 },
  title: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  body: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  time: { color: colors.textSecondary, marginTop: 4, fontSize: 11 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
});
