import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingsForMaster } from "@/services/bookingsApi";
import { subscribeToNotifications } from "@/services/notificationsApi";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MasterHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStats = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const bookings = await getBookingsForMaster(profile.uid);
      setPendingCount(bookings.filter((b) => b.status === "pending").length);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load your stats.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToNotifications(
      profile.uid,
      (notifications) => {
        setUnreadCount(notifications.filter((n) => !n.isRead).length);
      },
    );
    return unsubscribe;
  }, [profile]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push("/(master)/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.heroGreeting}>Hi, {profile?.displayName}</Text>
        <Text style={styles.heroTitle}>Your studio at a glance</Text>
        <Text style={styles.heroSubtitle}>
          Manage requests, services and your schedule
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage your studio</Text>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push("/(master)/profile")}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={colors.textPrimary}
            style={styles.gridIcon}
          />
          <Text style={styles.gridCardTitle}>My Profile</Text>
          <Text style={styles.gridCardSubtitle}>
            Edit name and specialization
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.requestsCard}
          onPress={() => router.push("/(master)/bookings")}
        >
          <View style={styles.requestsIconWrap}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.requestsCardTitle}>Client Requests</Text>
            <Text style={styles.requestsCardSubtitle}>
              {isLoading
                ? "Loading..."
                : pendingCount > 0
                  ? `${pendingCount} appointment${pendingCount > 1 ? "s" : ""} waiting for your confirmation`
                  : "No new requests right now"}
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/(master)/services")}
          >
            <Ionicons
              name="cut-outline"
              size={24}
              color={colors.textPrimary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>My Services</Text>
            <Text style={styles.gridCardSubtitle}>
              Add or edit what you offer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/(master)/portfolio")}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color={colors.textPrimary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>Portfolio</Text>
            <Text style={styles.gridCardSubtitle}>Showcase your work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/(master)/availability")}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.textPrimary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>Availability</Text>
            <Text style={styles.gridCardSubtitle}>Set your working hours</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>As a client</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/(client)")}
          >
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={colors.textPrimary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>Book an Appointment</Text>
            <Text style={styles.gridCardSubtitle}>
              Treat yourself at another master
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/(client)/bookings")}
          >
            <Ionicons
              name="receipt-outline"
              size={24}
              color={colors.textPrimary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>My Bookings</Text>
            <Text style={styles.gridCardSubtitle}>
              Appointments you've made
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.accent,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signOut: { color: "rgba(255,255,255,0.7)", fontWeight: "600", fontSize: 13 },
  bellButton: { position: "relative", padding: 4 },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  heroGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  heroSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 6 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  requestsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  requestsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  requestsCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  requestsCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 12,
  },
  grid: { flexDirection: "row", gap: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  gridIcon: { marginBottom: 8 },
  gridCardTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  gridCardSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
});
