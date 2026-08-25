import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getAvailability, setAvailability } from "@/services/availabilityApi";
import { WorkingHours } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Very light validation for "HH:MM" 24h format
function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function AvailabilityScreen() {
  const { profile } = useAuth();
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await getAvailability(profile.uid);
      setWorkingHours(
        [...data.workingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      );
      setExceptions(data.exceptions);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to load availability.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDay = (dayOfWeek: number, patch: Partial<WorkingHours>) => {
    setWorkingHours((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  };

  const toggleExceptionDate = (dateString: string) => {
    setExceptions((current) =>
      current.includes(dateString)
        ? current.filter((d) => d !== dateString)
        : [...current, dateString].sort(),
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    for (const day of workingHours) {
      if (!day.isWorking) continue;
      if (!isValidTime(day.startTime) || !isValidTime(day.endTime)) {
        Alert.alert(
          "Invalid time",
          `Check the start/end time for ${DAY_LABELS[day.dayOfWeek]} — use HH:MM, e.g. 09:00.`,
        );
        return;
      }
      if (day.startTime >= day.endTime) {
        Alert.alert(
          "Invalid time range",
          `On ${DAY_LABELS[day.dayOfWeek]}, start time must be before end time.`,
        );
        return;
      }
    }
    setIsSaving(true);
    try {
      await setAvailability(profile.uid, { workingHours, exceptions });
      Alert.alert("Saved", "Your availability has been updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to save availability.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const markedDates = exceptions.reduce<Record<string, any>>((acc, date) => {
    acc[date] = {
      selected: true,
      selectedColor: colors.danger,
    };
    return acc;
  }, {});

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>Availability</Text>
      <Text style={styles.subheader}>
        Set the hours you work each week, then mark any specific dates you're
        off.
      </Text>

      <Text style={styles.sectionTitle}>Weekly hours</Text>
      {workingHours.map((day) => (
        <View key={day.dayOfWeek} style={styles.dayRow}>
          <View style={styles.dayRowTop}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day.dayOfWeek]}</Text>
            <Switch
              value={day.isWorking}
              onValueChange={(value) =>
                updateDay(day.dayOfWeek, { isWorking: value })
              }
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {day.isWorking && (
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={day.startTime}
                onChangeText={(text) =>
                  updateDay(day.dayOfWeek, { startTime: text })
                }
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.timeSeparator}>—</Text>
              <TextInput
                style={styles.timeInput}
                value={day.endTime}
                onChangeText={(text) =>
                  updateDay(day.dayOfWeek, { endTime: text })
                }
                placeholder="18:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
            </View>
          )}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Days off</Text>
      <Text style={styles.sectionHint}>
        Tap a date to mark it as unavailable (vacation, sick day, fully booked
        elsewhere). Tap again to remove it.
      </Text>
      <Calendar
        onDayPress={(day: DateData) => toggleExceptionDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.danger,
          selectedDayTextColor: "#FFFFFF",
          todayTextColor: colors.accent,
          dayTextColor: colors.textPrimary,
          arrowColor: colors.textPrimary,
          monthTextColor: colors.textPrimary,
        }}
        style={styles.calendar}
      />
      {exceptions.length > 0 && (
        <Text style={styles.exceptionsSummary}>
          {exceptions.length} day{exceptions.length > 1 ? "s" : ""} marked as
          off
        </Text>
      )}

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save availability"}
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  subheader: { color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  dayRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    width: 80,
    textAlign: "center",
  },
  timeSeparator: { color: colors.textSecondary },
  calendar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  exceptionsSummary: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.accentText, fontWeight: "600", fontSize: 16 },
});
