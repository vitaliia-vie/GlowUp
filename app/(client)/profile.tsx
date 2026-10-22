import AvatarEditor from "@/components/AvatarEditor";
import BackButton from "@/components/BackButton";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profileApi";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ClientProfileScreen() {
  const { profile, setProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    if (!displayName.trim()) {
      Alert.alert("Missing field", "Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(profile.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      setProfile({
        ...profile,
        displayName: displayName.trim(),
        phone: phone.trim(),
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <BackButton fallbackHref="/(client)" />

      <Text style={styles.header}>My profile</Text>

      <View style={styles.avatarSection}>
        <AvatarEditor displayName={displayName} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+47 000 00 000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
  },
  email: { color: colors.textSecondary, fontSize: 15, marginTop: 6 },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: colors.accentText, fontWeight: "600", fontSize: 16 },
});