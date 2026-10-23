import Avatar from "@/components/Avatar";
import InstagramPreview from "@/components/InstagramPreview";
import StarRating from "@/components/StarRating";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getMasterProfile } from "@/services/mastersApi";
import { getPortfolioByMaster } from "@/services/portfolioApi";
import { getReviewsByMaster, summarizeReviews } from "@/services/reviewsApi";
import { PortfolioItem, Review, UserProfile } from "@/types";
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
  const { profile } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [master, setMaster] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [masterData, portfolioData, reviewsData] = await Promise.all([
        getMasterProfile(id),
        getPortfolioByMaster(id),
        getReviewsByMaster(id),
      ]);
      setMaster(masterData);
      setPortfolio(portfolioData);
      setReviews(reviewsData);
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

  const { average, count } = summarizeReviews(reviews);

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
              <Avatar
                displayName={master.displayName}
                avatarUrl={master.avatarUrl}
                size={64}
              />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.masterName} numberOfLines={2}>
                {master.displayName}
              </Text>
              <Text style={styles.masterSpecialization} numberOfLines={1}>
                {master.specialization ?? "Beauty master"}
              </Text>
              {count > 0 ? (
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={14} color="#F2C14E" />
                  <Text style={styles.heroRatingText}>
                    {average.toFixed(1)} · {count}{" "}
                    {count === 1 ? "review" : "reviews"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.masterPhone}>No reviews yet</Text>
              )}
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
                        {master.uid !== profile?.uid && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => toggleFavorite(master.uid)}
              >
                <Ionicons
                  name={isFavorite(master.uid) ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite(master.uid) ? "#F08CA3" : "#FFFFFF"}
                />
              </TouchableOpacity>
            )}
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

        {/* Reviews */}
        {reviews.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{average.toFixed(1)}</Text>
              <View style={{ gap: 4 }}>
                <StarRating value={average} size={18} />
                <Text style={styles.summaryCount}>
                  Based on {count} {count === 1 ? "review" : "reviews"}
                </Text>
              </View>
            </View>

            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName} numberOfLines={1}>
                    {review.clientName}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <StarRating value={review.rating} size={14} />
                <Text style={styles.reviewService}>{review.serviceName}</Text>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {!master.instagram && portfolio.length === 0 && reviews.length === 0 ? (
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
  heroRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  heroRatingText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  summaryNumber: { fontSize: 36, fontWeight: "700", color: colors.textPrimary },
  summaryCount: { fontSize: 12, color: colors.textSecondary },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  reviewDate: { fontSize: 11, color: colors.textSecondary },
  reviewService: { fontSize: 12, color: colors.textSecondary },
  reviewComment: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
  },
});