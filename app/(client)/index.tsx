import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getMastersByCategory } from "@/services/mastersApi";
import { subscribeToNotifications } from "@/services/notificationsApi";
import { SERVICE_CATEGORIES, ServiceCategory, UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CategorySection = {
  category: ServiceCategory;
  label: string;
  masters: UserProfile[];
};

export default function ClientHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const [sections, setSections] = useState<CategorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        SERVICE_CATEGORIES.map(async (cat) => ({
          category: cat.id,
          label: cat.label,
          masters: await getMastersByCategory(cat.id),
        })),
      );
      setSections(results.filter((s) => s.masters.length > 0));
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load masters.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

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
            onPress={() => router.push("/(client)/notifications")}
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

        <View style={styles.heroGreetingRow}>
          <Ionicons
            name="hand-left-outline"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.heroGreeting}>Hi, {profile?.displayName}</Text>
        </View>
        <Text style={styles.heroTitle}>Find your next glow-up</Text>
        <Text style={styles.heroSubtitle}>
          Book trusted beauty pros near you, in seconds
        </Text>

        <TouchableOpacity
          style={styles.bookingsButton}
          onPress={() => router.push("/(client)/bookings")}
        >
          <Ionicons name="receipt-outline" size={16} color={colors.accent} />
          <Text style={styles.bookingsButtonText}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : sections.length === 0 ? (
        <Text style={styles.emptyText}>
          No masters have joined yet — check back soon.
        </Text>
      ) : (
        sections.map((section) => (
          <View key={section.category} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {section.masters.map((master) => (
                <TouchableOpacity
                  key={master.uid}
                  style={styles.masterCard}
                  onPress={() => router.push(`/(client)/master/${master.uid}`)}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {master.displayName?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <Text style={styles.masterName} numberOfLines={1}>
                    {master.displayName}
                  </Text>
                  <Text style={styles.masterSpecialization} numberOfLines={1}>
                    {master.specialization ?? "Beauty master"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))
      )}
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
  heroGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  heroGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  heroTitle: {
    color: colors.accentText,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  bookingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
  },
  bookingsButtonText: { color: colors.accent, fontWeight: "700", fontSize: 15 },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  carousel: { paddingHorizontal: 20, gap: 12 },
  masterCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  masterName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  masterSpecialization: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});
