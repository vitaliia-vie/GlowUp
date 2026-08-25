import { DEV_TEST_CLIENT, DEV_TEST_MASTER } from "@/constants/devAccounts";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Only ever rendered in development builds (see login.tsx) — this never
// ships to a real device build, so it's not something end users would see.
export default function DevLoginButtons() {
  const { signIn } = useAuth();
  const [loadingRole, setLoadingRole] = useState<"client" | "master" | null>(
    null,
  );

  const quickSignIn = async (
    role: "client" | "master",
    credentials: { email: string; password: string },
  ) => {
    setLoadingRole(role);
    try {
      await signIn(credentials.email, credentials.password);
    } catch (error: any) {
      Alert.alert(
        "Test login failed",
        `Make sure you've registered a ${role} account with these exact credentials in constants/devAccounts.ts.\n\n${error.message ?? ""}`,
      );
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>DEV ONLY</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.devButton}
          onPress={() => quickSignIn("client", DEV_TEST_CLIENT)}
          disabled={loadingRole !== null}
        >
          {loadingRole === "client" ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.devButtonText}>Test Client</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.devButton}
          onPress={() => quickSignIn("master", DEV_TEST_MASTER)}
          disabled={loadingRole !== null}
        >
          {loadingRole === "master" ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.devButtonText}>Test Master</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 28 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  row: { flexDirection: "row", gap: 10 },
  devButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  devButtonText: { color: colors.textPrimary, fontWeight: "600", fontSize: 13 },
});
