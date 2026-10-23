import BackButton from "@/components/BackButton";
import NotificationIcon from "@/components/NotificationIcon";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  AppNotification,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
} from "@/services/notificationsApi";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MasterNotificationsScreen() {
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
    if (notification.type === "new_booking") {
      router.push("/(master)/bookings");
    } else if (notification.type === "new_review" && notification.relatedId) {
      // relatedId is the master's own id: open the public profile with reviews
      router.push(`/(client)/master/${notification.relatedId}` as any);
    } else if (notification.type === "new_message" && notification.relatedId) {
      const clientId = notification.relatedId.split("_")[0];
      // @ts-ignore
      router.push({
        pathname: "/(master)/chat/[clientId]",
        params: { clientId },
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    try {
      await markAllAsRead(profile.uid);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to mark as read.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <BackButton fallbackHref="/(master)" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton fallbackHref="/(master)" />

      <View style={styles.headerRow}>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity
          style={[
            styles.markAllButton,
            unreadCount === 0 && styles.markAllButtonDisabled,
          ]}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={16}
            color={colors.textPrimary}
          />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
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
            <NotificationIcon type={item.type} />
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
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllButtonDisabled: { opacity: 0.45 },
  markAllText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
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
  cardUnread: { borderColor: colors.accent },
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