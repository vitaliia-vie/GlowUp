import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getAllMasters, getMastersByCategory } from "@/services/mastersApi";
import { SERVICE_CATEGORIES, ServiceCategory, UserProfile } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
export default function ClientHome() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [masters, setMasters] = useState<UserProfile[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadMasters = useCallback(async (category: ServiceCategory | null) => {
    setIsLoading(true);
    try {
      const data = category
        ? await getMastersByCategory(category)
        : await getAllMasters();
      setMasters(data);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load masters.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadMasters(selectedCategory);
  }, [selectedCategory, loadMasters]);
  const handleSelectCategory = (category: ServiceCategory) => {
    setSelectedCategory((current) => (current === category ? null : category));
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hi, {profile?.displayName}</Text>
          <Text style={styles.subtitle}>Find your next appointment</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.bookingsCard}
        onPress={() => router.push("/(client)/bookings")}
      >
        <Text style={styles.bookingsCardTitle}>My Bookings</Text>
        <Text style={styles.bookingsCardSubtitle}>
          View, cancel or track your appointments
        </Text>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
      >
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => handleSelectCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
      ) : (
        <FlatList
          data={masters}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={{ paddingTop: 8 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedCategory
                ? "No masters found for this category yet."
                : "No masters have joined yet — check back soon."}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.masterCard}
              onPress={() => router.push(`/(client)/master/${item.uid}`)}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {item.displayName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.masterName}>{item.displayName}</Text>
                <Text style={styles.masterSpecialization}>
                  {item.specialization ?? "Beauty master"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  signOut: { color: colors.textSecondary, fontWeight: "600" },
  bookingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  bookingsCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bookingsCardSubtitle: { color: colors.textSecondary, fontSize: 13 },
  categoryRow: { marginBottom: 12, maxHeight: 44 },
  categoryChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  categoryChipTextActive: { color: colors.accentText },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 24,
  },
  masterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  masterName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  masterSpecialization: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
});
