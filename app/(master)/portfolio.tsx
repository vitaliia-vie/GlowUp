import InstagramCard from "@/components/InstagramCard";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { pickPortfolioImage } from "@/services/imageService";
import {
  addPortfolioPhoto,
  deletePortfolioPhoto,
  getPortfolioByMaster,
} from "@/services/portfolioApi";
import { PortfolioItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
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
  const router = useRouter();
  const [photos, setPhotos] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPicking, setIsPicking] = useState(false);
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

  const handlePick = async () => {
    setIsPicking(true);
    try {
      const image = await pickPortfolioImage();
      if (image) setPickedImage(image);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to open your photos.");
    } finally {
      setIsPicking(false);
    }
  };

  const handleAdd = async () => {
    if (!profile) return;
    if (!pickedImage) {
      Alert.alert("No photo", "Please choose a photo first.");
      return;
    }

    setIsAdding(true);
    try {
      const newPhoto = await addPortfolioPhoto(
        profile.uid,
        pickedImage,
        caption.trim(),
      );
      setPhotos((prev) => [newPhoto, ...prev]);
      setPickedImage(null);
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

  const header = (
    <View style={{ gap: 12 }}>
      <View style={styles.form}>
        <TouchableOpacity
          style={styles.pickArea}
          onPress={handlePick}
          disabled={isPicking || isAdding}
          activeOpacity={0.8}
        >
          {pickedImage ? (
            <Image
              source={{ uri: pickedImage }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : isPicking ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Ionicons
                name="image-outline"
                size={30}
                color={colors.textSecondary}
              />
              <Text style={styles.pickText}>Choose photo from your phone</Text>
            </>
          )}
        </TouchableOpacity>
        {pickedImage ? (
          <Text style={styles.pickHint}>Tap the photo to choose another</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Caption (optional)"
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
        />
        <TouchableOpacity
          style={[styles.addButton, !pickedImage && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={!pickedImage || isAdding}
        >
          <Text style={styles.addButtonText}>
            {isAdding ? "Adding..." : "+ Add photo"}
          </Text>
        </TouchableOpacity>
      </View>

      {profile?.instagram ? (
        <InstagramCard handle={profile.instagram} />
      ) : (
        <TouchableOpacity
          style={styles.instagramHint}
          onPress={() => router.push("/(master)/profile")}
        >
          <Ionicons
            name="logo-instagram"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.instagramHintText}>
            Add your Instagram in My Profile to show it here
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Portfolio",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={{ gap: GAP }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: GAP,
          paddingBottom: 40,
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              style={{ marginTop: 24 }}
              color={colors.accent}
            />
          ) : (
            <Text style={styles.emptyText}>
              No photos yet — add your first work above.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.photoCard}
            onLongPress={() => handleDelete(item)}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.photo}
              resizeMode="cover"
              onError={(e) => console.log("Image error:", e.nativeEvent.error)}
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
  },
  pickArea: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
    gap: 8,
  },
  preview: { width: "100%", height: "100%" },
  pickText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
  pickHint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
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
  addButtonDisabled: { backgroundColor: colors.surfaceMuted },
  addButtonText: { color: colors.accentText, fontWeight: "600" },
  instagramHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  instagramHintText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 20,
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