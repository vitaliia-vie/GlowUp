import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
    addPortfolioPhoto,
    deletePortfolioPhoto,
    getPortfolioByMaster,
} from "@/services/portfolioApi";
import { PortfolioItem } from "@/types";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const COLUMN_COUNT = 2;
const GAP = 12;
const CARD_WIDTH = (Dimensions.get("window").width - 40 - GAP) / COLUMN_COUNT;

export default function PortfolioScreen() {
  const { profile } = useAuth();
  const [photos, setPhotos] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await getPortfolioByMaster(profile.uid);
      setPhotos(data);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load portfolio.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleAdd = async () => {
    if (!profile) return;
    if (!imageUrl.trim()) {
      Alert.alert("Missing URL", "Please paste an image URL.");
      return;
    }
    if (!imageUrl.startsWith("http")) {
      Alert.alert("Invalid URL", "URL must start with http:// or https://");
      return;
    }

    setIsAdding(true);
    try {
      const newPhoto = await addPortfolioPhoto(
        profile.uid,
        imageUrl.trim(),
        caption.trim(),
      );
      setPhotos((prev) => [newPhoto, ...prev]);
      setImageUrl("");
      setCaption("");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to add photo.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (photo: PortfolioItem) => {
    Alert.alert("Delete photo", "Remove this photo from your portfolio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePortfolioPhoto(photo.id);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          } catch (error: any) {
            Alert.alert("Error", error.message ?? "Failed to delete photo.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Portfolio",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Paste image URL (https://...)"
          placeholderTextColor={colors.textSecondary}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextInput
          style={styles.input}
          placeholder="Caption (optional)"
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={isAdding}
        >
          <Text style={styles.addButtonText}>
            {isAdding ? "Adding..." : "+ Add photo"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
      ) : photos.length === 0 ? (
        <Text style={styles.emptyText}>
          No photos yet — add your first work above.
        </Text>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{
            gap: GAP,
            paddingTop: 12,
            paddingBottom: 40,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoCard}
              onLongPress={() => handleDelete(item)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.photo}
                resizeMode="cover"
                onError={(e) =>
                  console.log("Image error:", e.nativeEvent.error)
                }
              />
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.caption}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 20,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: { color: colors.accentText, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 32,
  },
  photoCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: CARD_WIDTH, height: CARD_WIDTH },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
    padding: 8,
  },
  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});
