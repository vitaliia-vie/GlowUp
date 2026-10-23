import { useAuth } from "@/contexts/AuthContext";
import { setFavoriteMaster } from "@/services/profileApi";
import { Alert } from "react-native";

export function useFavorites() {
  const { profile, setProfile } = useAuth();
  const favoriteIds = profile?.favoriteMasterIds ?? [];

  const isFavorite = (masterId: string) => favoriteIds.includes(masterId);

  const toggleFavorite = async (masterId: string) => {
    if (!profile) return;
    const wasFavorite = favoriteIds.includes(masterId);
    const next = wasFavorite
      ? favoriteIds.filter((id) => id !== masterId)
      : [...favoriteIds, masterId];

    // Update the heart instantly, roll back if saving fails
    setProfile({ ...profile, favoriteMasterIds: next });
    try {
      await setFavoriteMaster(profile.uid, masterId, !wasFavorite);
    } catch (error: any) {
      setProfile({ ...profile, favoriteMasterIds: favoriteIds });
      Alert.alert(
        "Error",
        error.message ?? "Could not update your saved masters.",
      );
    }
  };

  return { favoriteIds, isFavorite, toggleFavorite };
}