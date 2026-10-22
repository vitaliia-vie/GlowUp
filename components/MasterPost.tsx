import Avatar from "@/components/Avatar";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { colors } from "@/constants/theme";
import { getPortfolioPreview } from "@/services/portfolioApi";
import {
  PortfolioItem,
  SERVICE_CATEGORIES,
  ServiceCategory,
  UserProfile,
} from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PREVIEW_COUNT = 3;

// Photos are loaded lazily when a post appears on screen and kept here,
// so scrolling back up doesn't download them again.
const previewCache = new Map<string, PortfolioItem[]>();

export function clearMasterPostCache() {
  previewCache.clear();
}

type Props = {
  master: UserProfile;
  categories: ServiceCategory[];
};

export default function MasterPost({ master, categories }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PortfolioItem[] | null>(
    previewCache.get(master.uid) ?? null,
  );

  useEffect(() => {
    if (photos !== null) return;
    let active = true;

    getPortfolioPreview(master.uid, PREVIEW_COUNT)
      .then((data) => {
        previewCache.set(master.uid, data);
        if (active) setPhotos(data);
      })
      .catch(() => {
        if (active) setPhotos([]);
      });

    return () => {
      active = false;
    };
  }, [master.uid, photos]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/(client)/master/${master.uid}`)}
    >
      <View style={styles.header}>
                <Avatar
          displayName={master.displayName}
          avatarUrl={master.avatarUrl}
          size={44}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {master.displayName}
          </Text>
          <Text style={styles.specialization} numberOfLines={1}>
            {master.specialization ?? "Beauty master"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {photos === null ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.placeholder}>
          <Ionicons
            name="images-outline"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={styles.placeholderText}>No photos yet</Text>
        </View>
      ) : (
        <View style={styles.photosRow}>
          {photos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.imageUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {categories.length > 0 && (
        <View style={styles.tagsRow}>
          {categories.slice(0, 3).map((category) => (
            <View
              key={category}
              style={[styles.tag, { backgroundColor: CATEGORY_COLORS[category] }]}
            >
              <Text style={styles.tagText}>
                {SERVICE_CATEGORIES.find((c) => c.id === category)?.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  specialization: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  photosRow: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    flex: 1,
    height: 130,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderText: { fontSize: 12, color: colors.textSecondary },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
});