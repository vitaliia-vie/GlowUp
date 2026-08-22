import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MasterHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {profile?.displayName}</Text>
      <Text style={styles.subtitle}>Manage your services and bookings</Text>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => router.push("/(master)/bookings")}
      >
        <Text style={styles.menuCardTitle}>Booking Requests</Text>
        <Text style={styles.menuCardSubtitle}>
          Review and respond to client appointments
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => router.push("/(master)/services")}
      >
        <Text style={styles.menuCardTitle}>My Services</Text>
        <Text style={styles.menuCardSubtitle}>
          Add, edit or remove the services you offer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 32,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  menuCardSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  signOutButton: {
    marginTop: "auto",
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: {
    color: colors.accentText,
    fontWeight: "600",
  },
});
