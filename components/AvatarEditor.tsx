import Avatar from "@/components/Avatar";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { pickAvatarImage } from "@/services/imageService";
import { updateProfile } from "@/services/profileApi";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SIZE = 96;

type Props = {
  // Name currently typed in the form, so the fallback avatar matches it
  displayName: string;
};

export default function AvatarEditor({ displayName }: Props) {
  const { profile, setProfile } = useAuth();
  const [isBusy, setIsBusy] = useState(false);

  const save = async (avatarUrl: string) => {
    if (!profile) return;
    await updateProfile(profile.uid, { avatarUrl });
    setProfile({ ...profile, avatarUrl });
  };

  const handlePick = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const image = await pickAvatarImage();
      if (image) await save(image);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Could not update your photo.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await save("");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Could not remove your photo.");
    } finally {
      setIsBusy(false);
    }
  };

  const hasPhoto = Boolean(profile?.avatarUrl);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePick}
        disabled={isBusy}
      >
        <Avatar
          displayName={displayName}
          avatarUrl={profile?.avatarUrl}
          size={SIZE}
        />

        {isBusy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color={colors.accentText} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePick} disabled={isBusy}>
        <Text style={styles.actionText}>
          {hasPhoto ? "Change photo" : "Add photo"}
        </Text>
      </TouchableOpacity>

      {hasPhoto && !isBusy && (
        <TouchableOpacity onPress={handleRemove}>
          <Text style={styles.removeText}>Remove photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10 },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  busyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: colors.textPrimary, fontWeight: "600", fontSize: 14 },
  removeText: { color: colors.textSecondary, fontSize: 13 },
});