import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email, password, displayName, role);
    } catch (error: any) {
      Alert.alert("Registration failed", error.message ?? "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <View style={styles.roleSwitch}>
        <TouchableOpacity
          style={[
            styles.roleOption,
            role === "client" && styles.roleOptionActive,
          ]}
          onPress={() => setRole("client")}
        >
          <Text
            style={[
              styles.roleText,
              role === "client" && styles.roleTextActive,
            ]}
          >
            I'm a client
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleOption,
            role === "master" && styles.roleOptionActive,
          ]}
          onPress={() => setRole("master")}
        >
          <Text
            style={[
              styles.roleText,
              role === "master" && styles.roleTextActive,
            ]}
          >
            I'm a master
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={colors.textSecondary}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Creating..." : "Create account"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 24,
  },
  roleSwitch: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  roleOptionActive: { backgroundColor: colors.accent },
  roleText: { color: colors.textSecondary, fontWeight: "600" },
  roleTextActive: { color: colors.accentText },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.accentText, fontWeight: "600", fontSize: 16 },
  link: { marginTop: 20, alignSelf: "center" },
  linkText: { color: colors.textSecondary },
});
