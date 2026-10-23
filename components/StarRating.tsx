import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const GOLD = "#D9A520";

type Props = {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
};

export default function StarRating({ value, size = 16, onChange }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        // Rounded so 4.6 shows 5 filled stars, 4.4 shows 4
        const filled = star <= Math.round(value);
        const icon = (
          <Ionicons
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? GOLD : "#C9C3B8"}
          />
        );

        return onChange ? (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            {icon}
          </TouchableOpacity>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
});