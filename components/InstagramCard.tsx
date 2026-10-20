import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Accepts "@anna.nails", "anna.nails" or a full profile link -> "anna.nails"
export function extractInstagramHandle(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const fromUrl = withoutQuery.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const raw = fromUrl ? fromUrl[1] : withoutQuery.replace(/^@/, "");
  return raw.replace(/\/+$/, "");
}

export function isValidInstagramHandle(handle: string): boolean {
  return /^[A-Za-z0-9._]{1,30}$/.test(handle);
}

type Props = {
  handle: string;
};

export default function InstagramCard({ handle }: Props) {
  if (!handle) return null;

  const openInstagram = async () => {
    try {
      await Linking.openURL(`https://instagram.com/${handle}`);
    } catch {
      Alert.alert("Error", "Could not open Instagram.");
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={openInstagram}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="logo-instagram" size={26} color={colors.accentText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.handle}>@{handle}</Text>
        <Text style={styles.hint}>See more of my work on Instagram</Text>
      </View>
      <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});