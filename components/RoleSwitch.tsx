import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  active: "studio" | "discover";
};

export default function RoleSwitch({ active }: Props) {
  const router = useRouter();

  const isStudio = active === "studio";

  return (
    <View style={styles.track}>
      <TouchableOpacity
        style={[styles.option, isStudio && styles.optionActive]}
        activeOpacity={0.8}
        onPress={() => {
          if (!isStudio) router.replace("/(master)");
        }}
      >
        <Ionicons
          name="storefront-outline"
          size={15}
          color={isStudio ? colors.accent : "rgba(255,255,255,0.8)"}
        />
        <Text style={[styles.text, isStudio && styles.textActive]}>
          My studio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, !isStudio && styles.optionActive]}
        activeOpacity={0.8}
        onPress={() => {
          if (isStudio) router.replace("/(client)");
        }}
      >
        <Ionicons
          name="compass-outline"
          size={15}
          color={!isStudio ? colors.accent : "rgba(255,255,255,0.8)"}
        />
        <Text style={[styles.text, !isStudio && styles.textActive]}>
          Discover
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: 4,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  optionActive: { backgroundColor: colors.surface },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  textActive: { color: colors.accent },
});