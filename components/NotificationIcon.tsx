import { colors } from "@/constants/theme";
import type { AppNotification } from "@/services/notificationsApi";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CONFIG: Record<
  AppNotification["type"],
  { icon: IconName; color: string; background: string }
> = {
  new_booking: {
    icon: "calendar-outline",
    color: colors.accent,
    background: colors.surfaceMuted,
  },
  booking_confirmed: {
    icon: "checkmark-circle-outline",
    color: "#2E8B57",
    background: "#E6F2EB",
  },
  booking_cancelled: {
    icon: "close-circle-outline",
    color: colors.danger,
    background: "#F6E6E3",
  },
  new_message: {
    icon: "chatbubble-ellipses-outline",
    color: colors.accent,
    background: colors.surfaceMuted,
  },
};

type Props = {
  type: AppNotification["type"];
};

export default function NotificationIcon({ type }: Props) {
  const { icon, color, background } = CONFIG[type];

  return (
    <View style={[styles.circle, { backgroundColor: background }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});