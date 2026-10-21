import Avatar from "@/components/Avatar";
import InstagramPreview from "@/components/InstagramPreview";
import { colors } from "@/constants/theme";
import { getMasterProfile } from "@/services/mastersApi";
import { getPortfolioByMaster } from "@/services/portfolioApi";
import { PortfolioItem, UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GRID_GAP = 10;
const PHOTO_SIZE = Math.floor(
  (Dimensions.get("window").width - 40 - GRID_GAP) / 2,
);

export default function MasterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [master, setMaster] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [masterData, portfolioData] = await Promise.all([
        getMasterProfile(id),
        getPortfolioByMaster(id),
      ]);
      setMaster(masterData);
      setPortfolio(portfolioData);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load master profile.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!master) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Master not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero: avatar + name + actions */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroRow}>
            <View style={styles.avatarRing}>
              <Avatar displayName={master.displayName} size={64} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.masterName} numberOfLines={2}>
                {master.displayName}
              </Text>
              <Text style={styles.masterSpecialization} numberOfLines={1}>
                {master.specialization ?? "Beauty master"}
              </Text>
              {master.phone ? (
                <Text style={styles.masterPhone}>{master.phone}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push(`/(client)/booking/${master.uid}`)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.accent}
              />
              <Text style={styles.bookButtonText}>Book appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => {
                router.push({
                  pathname: "/(client)/chat/[masterId]" as any,
                  params: {
                    masterId: master.uid,
                    masterName: master.displayName,
                  },
                });
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram window */}
        {master.instagram ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instagram</Text>
            <InstagramPreview handle={master.instagram} />
          </View>
        ) : null}

        {/* Manually uploaded photos */}
        {portfolio.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.portfolioGrid}>
              {portfolio.map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: item.imageUrl }}
                  style={styles.portfolioImage}
                  resizeMode="cover"
                  onError={(e) =>
                    console.log("Image error:", e.nativeEvent.error)
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {!master.instagram && portfolio.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 32 }]}>
            This master hasn't shared any work yet.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: colors.accent,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: -4,
    marginBottom: 16,
  },
  backText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroInfo: { flex: 1 },
  masterName: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  masterSpecialization: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 2,
  },
  masterPhone: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  bookButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
  },
  bookButtonText: { color: colors.accent, fontWeight: "700", fontSize: 15 },
  messageButton: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  portfolioImage: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
  },
});