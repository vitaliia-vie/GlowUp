import Avatar from "@/components/Avatar";
import MasterPost, { clearMasterPostCache } from "@/components/MasterPost";
import RoleSwitch from "@/components/RoleSwitch";
import { getServiceSuggestions } from "@/constants/catalog";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { subscribeToChats } from "@/services/chatApi";
import { getMasterProfile } from "@/services/mastersApi";
import { subscribeToNotifications } from "@/services/notificationsApi";
import { getAllServices } from "@/services/servicesApi";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORY_ORDER = SERVICE_CATEGORIES.map((c) => c.id);

export default function ClientHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  const [masters, setMasters] = useState<UserProfile[]>([]);
  const [categoriesByMaster, setCategoriesByMaster] = useState<
    Record<string, ServiceCategory[]>
  >({});
  // Lower-case service titles of every master, used by the search
  const [titlesByMaster, setTitlesByMaster] = useState<
    Record<string, string[]>
  >({});

  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const loadMasters = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const services = await getAllServices();

      const categories: Record<string, ServiceCategory[]> = {};
      const titles: Record<string, string[]> = {};
      for (const service of services) {
        if (!categories[service.masterId]) {
          categories[service.masterId] = [];
          titles[service.masterId] = [];
        }
        if (!categories[service.masterId].includes(service.category)) {
          categories[service.masterId].push(service.category);
        }
        titles[service.masterId].push(service.title.toLowerCase());
      }
      for (const id of Object.keys(categories)) {
        categories[id].sort(
          (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
        );
      }

      // Only masters who offer at least one service can be booked
      const profiles = await Promise.all(
        Object.keys(categories).map((id) => getMasterProfile(id)),
      );
      const list = profiles.filter((p): p is UserProfile => p !== null);

      setMasters(list.sort((a, b) => b.createdAt - a.createdAt));
      setCategoriesByMaster(categories);
      setTitlesByMaster(titles);
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

  useEffect(() => {
    if (!profile?.uid) return;
    return subscribeToChats(profile.uid, (chats) => {
      setUnreadChats(chats.filter((chat) => chat.unread).length);
    });
  }, [profile?.uid]);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleMasters = useMemo(
    () =>
      masters
        .filter((master) => master.uid !== profile?.uid)
        .filter(
          (master) =>
            !selectedCategory ||
            categoriesByMaster[master.uid]?.includes(selectedCategory),
        )
        .filter((master) => !showSaved || favoriteIds.includes(master.uid))
        .filter((master) => {
          if (!normalizedSearch) return true;
          const categoryLabels = (categoriesByMaster[master.uid] ?? []).map(
            (id) => SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? "",
          );
          const haystack = [
            master.displayName,
            master.specialization ?? "",
            ...(titlesByMaster[master.uid] ?? []),
            ...categoryLabels,
          ]
            .join(" ")
            .toLowerCase();
          return normalizedSearch
            .split(/\s+/)
            .every((token) => haystack.includes(token));
        }),
    [
      masters,
      categoriesByMaster,
      titlesByMaster,
      selectedCategory,
      showSaved,
      favoriteIds,
      normalizedSearch,
      profile?.uid,
    ],
  );

  // Suggestions come from the catalog, but only services that some master
  // really offers
  const suggestions = useMemo(() => {
    if (normalizedSearch.length < 2) return [];
    const offered = new Set(Object.values(titlesByMaster).flat());
    return getServiceSuggestions(search, selectedCategory ?? "nails", 24)
      .filter((s) => offered.has(s.title.toLowerCase()))
      .slice(0, 6);
  }, [search, normalizedSearch, selectedCategory, titlesByMaster]);

  const hasFilters = Boolean(selectedCategory || showSaved || normalizedSearch);

  const resetFilters = () => {
    setSelectedCategory(null);
    setShowSaved(false);
    setSearch("");
  };

  const handleSelectCategory = (category: ServiceCategory) => {
    // Tapping the active category again clears the filter
    setSelectedCategory((current) => (current === category ? null : category));
  };

  const handleRefresh = () => {
    clearMasterPostCache();
    setRefreshKey((key) => key + 1);
    loadMasters(true);
  };

  const openMyProfile = () => {
    router.push(
      (profile?.role === "master"
        ? "/(master)/profile"
        : "/(client)/profile") as any,
    );
  };

  const selectedLabel = selectedCategory
    ? SERVICE_CATEGORIES.find((c) => c.id === selectedCategory)?.label
    : null;

  const captionParts = [
    showSaved ? "Saved" : null,
    selectedLabel,
    normalizedSearch ? `"${search.trim()}"` : null,
  ].filter(Boolean);
  const caption = captionParts.length > 0 ? captionParts.join(" · ") : "All masters";

  const emptyText = showSaved && favoriteIds.length === 0
    ? "You haven't saved anyone yet. Tap the heart on a master to keep them here."
    : normalizedSearch
      ? `No masters match "${search.trim()}".`
      : selectedCategory
        ? "No masters in this category yet."
        : "No masters have joined yet — check back soon.";

  const header = (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>

          <View style={styles.topIcons}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/(master)/messages")}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#FFFFFF"
              />
              {unreadChats > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/(master)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#FFFFFF"
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {profile?.role === "master" && (
          <View style={styles.switchWrap}>
            <RoleSwitch active="discover" />
          </View>
        )}

        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.8}
          onPress={openMyProfile}
        >
          <View style={styles.avatarRing}>
            <Avatar
              displayName={profile?.displayName ?? ""}
              avatarUrl={profile?.avatarUrl}
              size={44}
            />
          </View>
          <View>
            <Text style={styles.heroGreeting}>Hi, {profile?.displayName}</Text>
            <Text style={styles.heroHint}>Edit profile</Text>
          </View>
        </TouchableOpacity>

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

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search masters or services"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {suggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestionsRow}
          >
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={`${suggestion.category}-${suggestion.title}`}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: CATEGORY_COLORS[suggestion.category] },
                ]}
                onPress={() => setSearch(suggestion.title)}
              >
                <Text style={styles.suggestionText}>{suggestion.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipPlain,
              !hasFilters && styles.chipActive,
            ]}
            onPress={resetFilters}
          >
            <Ionicons
              name="apps-outline"
              size={14}
              color={!hasFilters ? colors.accentText : colors.textPrimary}
            />
            <Text style={[styles.chipText, !hasFilters && styles.chipTextActive]}>
              All masters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipPlain,
              showSaved && styles.chipActive,
            ]}
            onPress={() => setShowSaved((current) => !current)}
          >
            <Ionicons
              name={showSaved ? "heart" : "heart-outline"}
              size={14}
              color={showSaved ? colors.accentText : colors.textPrimary}
            />
            <Text style={[styles.chipText, showSaved && styles.chipTextActive]}>
              Saved
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
            {caption} · {visibleMasters.length}{" "}
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
      extraData={favoriteIds}
      keyExtractor={(item) => `${item.uid}-${refreshKey}`}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <MasterPost
          master={item}
          categories={categoriesByMaster[item.uid] ?? []}
          isFavorite={isFavorite(item.uid)}
          onToggleFavorite={() => toggleFavorite(item.uid)}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{emptyText}</Text>
            {hasFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={resetFilters}
              >
                <Text style={styles.clearText}>Clear filters</Text>
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
  topIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroGreeting: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  heroHint: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 1 },
  heroTitle: {
    color: colors.accentText,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 16,
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

  searchSection: { marginTop: 20, paddingHorizontal: 20 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, padding: 0 },
  suggestionsRow: { gap: 8, paddingTop: 10 },
  suggestionChip: {
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestionText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },

  categoriesSection: { marginTop: 20, marginBottom: 16 },
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
  chipPlain: {
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
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  clearText: { color: colors.textPrimary, fontWeight: "600", fontSize: 13 },
});