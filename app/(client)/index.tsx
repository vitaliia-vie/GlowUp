import MasterPost, { clearMasterPostCache } from "@/components/MasterPost";
import RoleSwitch from "@/components/RoleSwitch";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getMastersByCategory } from "@/services/mastersApi";
import { subscribeToNotifications } from "@/services/notificationsApi";
import { SERVICE_CATEGORIES, ServiceCategory, UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const [masters, setMasters] = useState<UserProfile[]>([]);
  const [categoriesByMaster, setCategoriesByMaster] = useState<
    Record<string, ServiceCategory[]>
  >({});
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMasters = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const results = await Promise.all(
        SERVICE_CATEGORIES.map(async (cat) => ({
          category: cat.id,
          masters: await getMastersByCategory(cat.id),
        })),
      );

      // A master offering services in several categories appears once,
      // with all of their categories attached.
      const byId = new Map<string, UserProfile>();
      const categories: Record<string, ServiceCategory[]> = {};
      for (const { category, masters: list } of results) {
        for (const master of list) {
          byId.set(master.uid, master);
          if (!categories[master.uid]) categories[master.uid] = [];
          categories[master.uid].push(category);
        }
      }

      setMasters(
        Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt),
      );
      setCategoriesByMaster(categories);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load masters.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

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

  const visibleMasters = useMemo(
    () =>
      masters
        .filter((master) => master.uid !== profile?.uid)
        .filter(
          (master) =>
            !selectedCategory ||
            categoriesByMaster[master.uid]?.includes(selectedCategory),
        ),
    [masters, categoriesByMaster, selectedCategory, profile?.uid],
  );

  const handleSelectCategory = (category: ServiceCategory) => {
    // Tapping the active category again clears the filter
    setSelectedCategory((current) => (current === category ? null : category));
  };

  const handleRefresh = () => {
    clearMasterPostCache();
    setRefreshKey((key) => key + 1);
    loadMasters(true);
  };

  const selectedLabel = selectedCategory
    ? SERVICE_CATEGORIES.find((c) => c.id === selectedCategory)?.label
    : "All masters";

  const header = (
    <View>
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

        {profile?.role === "master" && (
          <View style={styles.switchWrap}>
            <RoleSwitch active="discover" />
          </View>
        )}

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

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipAll,
              selectedCategory === null && styles.chipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons
              name="apps-outline"
              size={14}
              color={
                selectedCategory === null ? colors.accentText : colors.textPrimary
              }
            />
            <Text
              style={[
                styles.chipText,
                selectedCategory === null && styles.chipTextActive,
              ]}
            >
              All masters
            </Text>
          </TouchableOpacity>

          {SERVICE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  { backgroundColor: CATEGORY_COLORS[cat.id] },
                  active && styles.chipActive,
                ]}
                onPress={() => handleSelectCategory(cat.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
                {active && (
                  <Ionicons name="close" size={14} color={colors.accentText} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!isLoading && (
          <Text style={styles.feedCaption}>
            {selectedLabel} · {visibleMasters.length}{" "}
            {visibleMasters.length === 1 ? "master" : "masters"}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={visibleMasters}
      keyExtractor={(item) => `${item.uid}-${refreshKey}`}
      renderItem={({ item }) => (
        <MasterPost
          master={item}
          categories={categoriesByMaster[item.uid] ?? []}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {selectedCategory
                ? "No masters in this category yet."
                : "No masters have joined yet — check back soon."}
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.showAllText}>Show all masters</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
        />
      }
    />
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
  switchWrap: { marginTop: 14 },
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
    marginTop: 12,
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
  categoriesSection: { marginTop: 24, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  chipsRow: { paddingHorizontal: 20, gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  chipAll: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  chipTextActive: { color: colors.accentText },
  feedCaption: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 14,
    marginHorizontal: 20,
  },
  emptyWrap: { alignItems: "center", marginTop: 40, paddingHorizontal: 20 },
  emptyText: { textAlign: "center", color: colors.textSecondary },
  showAllButton: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  showAllText: { color: colors.textPrimary, fontWeight: "600", fontSize: 13 },
});