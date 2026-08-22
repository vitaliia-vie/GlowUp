import { colors } from "@/constants/theme";
import { getMasterProfile } from "@/services/mastersApi";
import { getServicesByMaster } from "@/services/servicesApi";
import { Service, SERVICE_CATEGORIES, UserProfile } from "@/types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MasterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [master, setMaster] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [masterData, servicesData] = await Promise.all([
        getMasterProfile(id),
        getServicesByMaster(id),
      ]);
      setMaster(masterData);
      setServices(servicesData);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load master profile.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!master) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Master not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: master.displayName, headerBackTitle: "Back" }}
      />

      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {master.displayName?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.masterName}>{master.displayName}</Text>
        <Text style={styles.masterSpecialization}>
          {master.specialization ?? "Beauty master"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Services</Text>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            This master hasn't added any services yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() =>
              router.push(
                `/(client)/booking/${master.uid}?serviceId=${item.id}`,
              )
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceMeta}>
                {SERVICE_CATEGORIES.find((c) => c.id === item.category)?.label}{" "}
                · {item.durationMinutes} min
              </Text>
            </View>
            <Text style={styles.servicePrice}>${item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  masterName: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  masterSpecialization: { color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 16,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  serviceMeta: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  servicePrice: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
});
