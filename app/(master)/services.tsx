import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
    addService,
    deleteService,
    getServicesByMaster,
} from "@/services/servicesApi";
import { Service, SERVICE_CATEGORIES, ServiceCategory } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ServicesScreen() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState<ServiceCategory>(
    SERVICE_CATEGORIES[0].id,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await getServicesByMaster(profile.uid);
      setServices(data);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load services.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleAddService = async () => {
    if (!profile) return;

    const priceNum = Number(price);
    const durationNum = Number(duration);

    if (!title || !priceNum || !durationNum) {
      Alert.alert(
        "Missing fields",
        "Please fill in title, price, and duration.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addService(profile.uid, {
        title,
        category,
        price: priceNum,
        durationMinutes: durationNum,
      });
      setTitle("");
      setPrice("");
      setDuration("");
      await loadServices();
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to add service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert("Delete service", `Remove "${service.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteService(service.id);
            await loadServices();
          } catch (error: any) {
            Alert.alert("Error", error.message ?? "Failed to delete service.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Services</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Service name"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category</Text>
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
                category === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  category === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Price"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="Duration (min)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddService}
          disabled={isSubmitting}
        >
          <Text style={styles.addButtonText}>
            {isSubmitting ? "Adding..." : "Add service"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No services yet — add your first one above.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceMeta}>
                  {
                    SERVICE_CATEGORIES.find((c) => c.id === item.category)
                      ?.label
                  }{" "}
                  · ${item.price} · {item.durationMinutes} min
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 2,
  },
  categoryRow: { marginBottom: 10 },
  categoryChip: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1 },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: { color: colors.accentText, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 24,
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
  serviceMeta: { color: colors.textSecondary, marginTop: 2 },
  deleteText: { color: colors.danger, fontWeight: "600" },
});
