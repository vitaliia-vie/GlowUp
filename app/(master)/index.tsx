import Avatar from "@/components/Avatar";
import RoleSwitch from "@/components/RoleSwitch";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingsForMaster } from "@/services/bookingsApi";
import { getMasterProfile } from "@/services/mastersApi";
import { subscribeToNotifications } from "@/services/notificationsApi";
import { getServiceById } from "@/services/servicesApi";
import { Booking, BookingStatus } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { ComponentProps, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface UpcomingRow extends Booking {
  clientName: string;
  serviceName: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "#B08A2E",
  confirmed: "#2E8B57",
  cancelled: "#B3554A",
  completed: "#5C5854",
};

const ACTIONS: {
  title: string;
  subtitle: string;
  icon: IconName;
  href: string;
}[] = [
  {
    title: "My Services",
    subtitle: "What you offer",
    icon: "cut-outline",
    href: "/(master)/services",
  },
  {
    title: "Portfolio",
    subtitle: "Showcase your work",
    icon: "images-outline",
    href: "/(master)/portfolio",
  },
  {
    title: "Availability",
    subtitle: "Hours and days off",
    icon: "calendar-outline",
    href: "/(master)/availability",
  },
  {
    title: "My Profile",
    subtitle: "Name, phone, Instagram",
    icon: "person-outline",
    href: "/(master)/profile",
  },
];

// Local date as YYYY-MM-DD (not UTC, so "today" matches the phone's clock)
function todayLocalIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function MasterHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [nextAppointments, setNextAppointments] = useState<UpcomingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStats = useCallback(async () => {
    if (!profile) return;
    try {
      const bookings = await getBookingsForMaster(profile.uid);
      const today = todayLocalIso();

      const active = bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed",
      );
      const upcoming = active
        .filter((b) => b.date >= today)
        .sort((a, b) =>
          a.date === b.date
            ? a.timeSlot.localeCompare(b.timeSlot)
            : a.date.localeCompare(b.date),
        );

      setPendingCount(bookings.filter((b) => b.status === "pending").length);
      setTodayCount(upcoming.filter((b) => b.date === today).length);
      setUpcomingCount(upcoming.length);

      const rows = await Promise.all(
        upcoming.slice(0, 3).map(async (booking) => {
          const [client, service] = await Promise.all([
            getMasterProfile(booking.clientId),
            getServiceById(booking.serviceId),
          ]);
          return {
            ...booking,
            clientName: client?.displayName ?? "Unknown client",
            serviceName: service?.title ?? "Deleted service",
          };
        }),
      );
      setNextAppointments(rows);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load your studio.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Refresh every time the screen is shown (e.g. after confirming a booking)
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

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

  const statValue = (value: number) => (isLoading ? "–" : String(value));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>

          {/* Stripped out automatically in production builds */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.devButton}
              onPress={() => router.push("/(master)/dev-masters" as any)}
            >
              <Text style={styles.devLabel}>DEV</Text>
              <Text style={styles.devButtonText}>Test masters</Text>
            </TouchableOpacity>
          )}

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

        <View style={styles.switchWrap}>
          <RoleSwitch active="studio" />
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarRing}>
                        <Avatar
              displayName={profile?.displayName ?? ""}
              avatarUrl={profile?.avatarUrl}
              size={56}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>{greeting()},</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {profile?.displayName}
            </Text>
            <Text style={styles.heroSpecialization} numberOfLines={1}>
              {profile?.specialization || "Beauty master"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats floating over the hero */}
      <View style={styles.statsCard}>
        <TouchableOpacity
          style={styles.stat}
          activeOpacity={0.7}
          onPress={() => router.push("/(master)/bookings")}
        >
          <Text
            style={[
              styles.statValue,
              pendingCount > 0 && { color: colors.danger },
            ]}
          >
            {statValue(pendingCount)}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Text style={styles.statValue}>{statValue(todayCount)}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Text style={styles.statValue}>{statValue(upcomingCount)}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Requests shortcut */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.requestsCard}
          activeOpacity={0.85}
          onPress={() => router.push("/(master)/bookings")}
        >
          <View style={styles.requestsIconWrap}>
            <Ionicons
              name="mail-unread-outline"
              size={22}
              color={colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.requestsTitle}>Client requests</Text>
            <Text style={styles.requestsSubtitle}>
              {isLoading
                ? "Loading..."
                : pendingCount > 0
                  ? `${pendingCount} waiting for your confirmation`
                  : "No new requests right now"}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Next appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next appointments</Text>
          <TouchableOpacity onPress={() => router.push("/(master)/bookings")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.accent} />
        ) : nextAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={26}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No upcoming appointments yet.
            </Text>
          </View>
        ) : (
          nextAppointments.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.appointmentCard}
              activeOpacity={0.85}
              onPress={() => router.push("/(master)/bookings")}
            >
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>
                  {parseInt(item.date.slice(8, 10), 10)}
                </Text>
                <Text style={styles.dateMonth}>
                  {MONTHS[parseInt(item.date.slice(5, 7), 10) - 1]}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.appointmentService} numberOfLines={1}>
                  {item.serviceName}
                </Text>
                <Text style={styles.appointmentClient} numberOfLines={1}>
                  {item.clientName}
                </Text>
              </View>

              <View style={styles.appointmentRight}>
                <Text style={styles.appointmentTime}>{item.timeSlot}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLOR[item.status] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_COLOR[item.status] },
                    ]}
                  >
                    {item.status === "pending" ? "Pending" : "Confirmed"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage your studio</Text>
        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.actionCard}
              activeOpacity={0.85}
              onPress={() => router.push(action.href as any)}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name={action.icon} size={22} color={colors.accent} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
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
    paddingBottom: 52,
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
  devButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  devLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  devButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 12,
  },
  switchWrap: { marginTop: 14 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 22,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroGreeting: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  heroName: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginTop: 1 },
  heroSpecialization: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 20,
    marginTop: -30,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  seeAll: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },

  requestsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  requestsIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  requestsTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  requestsSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  emptyCard: {
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingVertical: 24,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13 },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  dateBadge: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  dateMonth: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  appointmentService: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  appointmentClient: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  appointmentRight: { alignItems: "flex-end" },
  appointmentTime: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    flexBasis: "45%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  actionSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
});