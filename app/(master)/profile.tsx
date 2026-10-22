import AvatarEditor from "@/components/AvatarEditor";
import {
  extractInstagramHandle,
  isValidInstagramHandle,
} from "@/components/InstagramCard";
import {
  findSpecializationCategory,
  SPECIALIZATIONS,
} from "@/constants/catalog";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profileApi";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/types";
import { Stack } from "expo-router";
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

export default function MasterProfileScreen() {
  const { profile, setProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [specialization, setSpecialization] = useState(
    profile?.specialization ?? "",
  );
  const [specCategory, setSpecCategory] = useState<ServiceCategory | null>(
    findSpecializationCategory(profile?.specialization),
  );
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    if (!displayName.trim()) {
      Alert.alert("Missing field", "Name cannot be empty.");
      return;
    }

    const instagramHandle = extractInstagramHandle(instagram);
    if (instagramHandle && !isValidInstagramHandle(instagramHandle)) {
      Alert.alert(
        "Invalid Instagram",
        "Use a username like anna.nails or paste your profile link.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(profile.uid, {
        displayName: displayName.trim(),
        specialization: specialization.trim(),
        phone: phone.trim(),
        instagram: instagramHandle,
      });
      setProfile({
        ...profile,
        displayName: displayName.trim(),
        specialization: specialization.trim(),
        phone: phone.trim(),
        instagram: instagramHandle,
      });
      setInstagram(instagramHandle);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentSpec = specialization.trim().toLowerCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: "Edit Profile",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />

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

        <Text style={styles.label}>Specialization</Text>
        <TextInput
          style={styles.input}
          value={specialization}
          onChangeText={setSpecialization}
          placeholder="Pick below or write your own"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.hint}>Your field</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {SERVICE_CATEGORIES.map((cat) => {
            const active = specCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: CATEGORY_COLORS[cat.id] },
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setSpecCategory(active ? null : cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {specCategory && (
          <>
            <Text style={styles.hint}>Choose how you want to be called</Text>
            <View style={styles.specWrap}>
              {SPECIALIZATIONS[specCategory].map((spec) => {
                const active = currentSpec === spec.toLowerCase();
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specChip, active && styles.specChipActive]}
                    onPress={() => setSpecialization(spec)}
                  >
                    <Text
                      style={[
                        styles.specChipText,
                        active && styles.specChipTextActive,
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+47 000 00 000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={styles.input}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@username or profile link"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
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
    paddingTop: 20,
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 6,
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
  chipsScroll: { marginBottom: 6 },
  categoryChip: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: colors.accent },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  categoryChipTextActive: { color: colors.accentText },
  specWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  specChip: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  specChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  specChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  specChipTextActive: { color: colors.accentText },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: colors.accentText, fontWeight: "600", fontSize: 16 },
});