import ReasonModal from "@/components/ReasonModal";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { generateTimeSlots, getAvailability } from "@/services/availabilityApi";
import {
  createBooking,
  getBookingById,
  getBookingsForMasterOnDate,
  rescheduleBooking,
} from "@/services/bookingsApi";
import { getMasterProfile } from "@/services/mastersApi";
import { getServicesByMaster } from "@/services/servicesApi";
import {
  Availability,
  Booking,
  SERVICE_CATEGORIES,
  Service,
  UserProfile,
} from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

const RESCHEDULE_REASONS = [
  "Schedule conflict",
  "Need a different time",
  "Feeling unwell",
];

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function BookingScreen() {
  const {
    masterId,
    serviceId: preselectedServiceId,
    rescheduleId,
  } = useLocalSearchParams<{
    masterId: string;
    serviceId?: string;
    rescheduleId?: string;
  }>();
  const { profile } = useAuth();
  const router = useRouter();

  const isRescheduling = Boolean(rescheduleId);

  const [master, setMaster] = useState<UserProfile | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    preselectedServiceId ?? null,
  );
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    if (!masterId) return;
    (async () => {
      setIsLoadingInitial(true);
      try {
        const [masterData, availabilityData, servicesData, bookingData] =
          await Promise.all([
            getMasterProfile(masterId),
            getAvailability(masterId),
            getServicesByMaster(masterId),
            rescheduleId ? getBookingById(rescheduleId) : Promise.resolve(null),
          ]);
        setMaster(masterData);
        setAvailability(availabilityData);
        setServices(servicesData);

        if (rescheduleId) {
          const canMove =
            bookingData &&
            bookingData.clientId === profile?.uid &&
            (bookingData.status === "pending" ||
              bookingData.status === "confirmed");

          if (!bookingData || !canMove) {
            Alert.alert(
              "Can't reschedule",
              "This booking can't be changed any more.",
            );
            router.back();
            return;
          }
          setExistingBooking(bookingData);
          setSelectedServiceId(bookingData.serviceId);
        }
      } catch (error: any) {
        Alert.alert("Error", error.message ?? "Failed to load booking info.");
      } finally {
        setIsLoadingInitial(false);
      }
    })();
  }, [masterId, rescheduleId, profile?.uid, router]);

  const loadBookedSlots = useCallback(
    async (date: string) => {
      if (!masterId) return;
      setIsLoadingSlots(true);
      try {
        const bookings = await getBookingsForMasterOnDate(masterId, date);
        setBookedSlots(bookings.map((b) => b.timeSlot));
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.message ?? "Failed to load available slots.",
        );
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [masterId],
  );

  useEffect(() => {
    loadBookedSlots(selectedDate);
    setSelectedSlot(null);
  }, [selectedDate, loadBookedSlots]);

  const availableSlots = useMemo(() => {
    if (!availability) return [];
    const dayOfWeek = new Date(selectedDate).getDay();
    const daySchedule = availability.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek,
    );
    if (!daySchedule || !daySchedule.isWorking) return [];
    if (availability.exceptions.includes(selectedDate)) return [];
    const allSlots = generateTimeSlots(
      daySchedule.startTime,
      daySchedule.endTime,
    );
    return allSlots.filter((slot) => !bookedSlots.includes(slot));
  }, [availability, selectedDate, bookedSlots]);

  const handleConfirm = async () => {
    // Surface exactly what's missing instead of silently doing nothing —
    // this branch should never actually trigger in normal use, it's a safety net.
    if (!profile) {
      Alert.alert("Not signed in", "Please sign in again and retry.");
      return;
    }
    if (!masterId) {
      Alert.alert("Missing master", "Please go back and open the master again.");
      return;
    }
    if (!selectedService) {
      Alert.alert("Select a service", "Please choose a service first.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Select a time", "Please pick a time slot first.");
      return;
    }

    // Moving an existing booking asks for an (optional) reason first
    if (isRescheduling) {
      setReasonOpen(true);
      return;
    }

    setIsConfirming(true);
    try {
      await createBooking({
        clientId: profile.uid,
        masterId,
        serviceId: selectedService.id,
        date: selectedDate,
        timeSlot: selectedSlot,
      });
      router.replace("/(client)/bookings");
      Alert.alert("Booked!", "Your appointment request has been sent.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to create booking.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmitReschedule = async (reason: string) => {
    if (!profile || !existingBooking || !selectedSlot) return;
    setIsConfirming(true);
    try {
      await rescheduleBooking(
        existingBooking.id,
        selectedDate,
        selectedSlot,
        reason,
        profile.displayName,
      );
      setReasonOpen(false);
      router.replace("/(client)/bookings");
      Alert.alert("Sent for confirmation", "The master will confirm your new time.");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to move the booking.");
    } finally {
      setIsConfirming(false);
    }
  };

  const renderServiceInfo = (service: Service) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceMeta}>
        {SERVICE_CATEGORIES.find((c) => c.id === service.category)?.label} ·{" "}
        {service.durationMinutes} min
      </Text>
    </View>
  );

  if (isLoadingInitial) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Stack.Screen
        options={{
          title: isRescheduling
            ? "Reschedule"
            : master
              ? `Book with ${master.displayName}`
              : "Book",
          headerBackTitle: "Back",
        }}
      />

      {/* The appointment being moved */}
      {isRescheduling && existingBooking && (
        <>
          <Text style={styles.sectionTitle}>Current appointment</Text>
          <View style={styles.currentCard}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.currentText}>
              {existingBooking.date} · {existingBooking.timeSlot}
            </Text>
          </View>
        </>
      )}

      {/* Step 1: choose a service (fixed while rescheduling) */}
      <Text style={styles.sectionTitle}>
        {selectedService ? "Your service" : "Choose a service"}
      </Text>

      {selectedService ? (
        <View style={[styles.serviceCard, styles.serviceCardActive]}>
          {renderServiceInfo(selectedService)}
          <Text style={styles.servicePrice}>${selectedService.price}</Text>
          {!isRescheduling && (
            <TouchableOpacity onPress={() => setSelectedServiceId(null)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : isRescheduling ? (
        <Text style={styles.emptyText}>
          The original service is no longer available. Please cancel this
          booking and book again.
        </Text>
      ) : services.length === 0 ? (
        <Text style={styles.emptyText}>
          This master hasn't added any services yet.
        </Text>
      ) : (
        services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => setSelectedServiceId(service.id)}
          >
            {renderServiceInfo(service)}
            <Text style={styles.servicePrice}>${service.price}</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Step 2: date, time and confirmation appear once a service is chosen */}
      {selectedService && (
        <>
          <Calendar
            current={selectedDate}
            minDate={todayIso()}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: colors.accent },
            }}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.accent,
              selectedDayTextColor: colors.accentText,
              todayTextColor: colors.accent,
              dayTextColor: colors.textPrimary,
              arrowColor: colors.textPrimary,
              monthTextColor: colors.textPrimary,
            }}
            style={styles.calendar}
          />

          <Text style={styles.sectionTitle}>
            {isRescheduling ? "New time" : "Available times"}
          </Text>
          {isLoadingSlots ? (
            <ActivityIndicator
              style={{ marginTop: 4 }}
              color={colors.accent}
            />
          ) : availableSlots.length === 0 ? (
            <Text style={styles.emptyText}>
              No available slots on this day.
            </Text>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotChip,
                    selectedSlot === slot && styles.slotChipActive,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotChipText,
                      selectedSlot === slot && styles.slotChipTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedSlot && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedSlot || isConfirming}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !selectedSlot && styles.confirmButtonTextDisabled,
              ]}
            >
              {isConfirming && !isRescheduling
                ? "Booking..."
                : selectedSlot
                  ? isRescheduling
                    ? `Move to ${selectedSlot}`
                    : `Confirm ${selectedSlot}`
                  : "Select a time"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <ReasonModal
        visible={reasonOpen}
        title="Reschedule appointment"
        subtitle={
          selectedSlot
            ? `New time: ${selectedDate} at ${selectedSlot}. The master will need to confirm it.`
            : undefined
        }
        placeholder="Reason (optional)"
        quickReasons={RESCHEDULE_REASONS}
        required={false}
        confirmLabel="Send request"
        isSubmitting={isConfirming}
        onClose={() => setReasonOpen(false)}
        onSubmit={handleSubmitReschedule}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
  },
  currentText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardActive: { borderColor: colors.accent },
  serviceTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  serviceMeta: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  servicePrice: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  changeText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 12,
  },
  calendar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 8,
    overflow: "hidden",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
  },
  slotChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  slotChipText: { color: colors.textPrimary, fontWeight: "600" },
  slotChipTextActive: { color: colors.accentText },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  confirmButtonDisabled: { backgroundColor: colors.surfaceMuted },
  confirmButtonText: {
    color: colors.accentText,
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButtonTextDisabled: { color: colors.textSecondary },
});