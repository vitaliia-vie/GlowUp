import { colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  placeholder: string;
  quickReasons: string[];
  // When true the button stays disabled until a reason is entered
  required: boolean;
  confirmLabel: string;
  destructive?: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export default function ReasonModal({
  visible,
  title,
  subtitle,
  placeholder,
  quickReasons,
  required,
  confirmLabel,
  destructive = false,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");

  // Start fresh every time the window opens
  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const trimmed = reason.trim();
  const blocked = required && trimmed === "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.chips}>
            {quickReasons.map((item) => {
              const active = trimmed === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setReason(item)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[
              styles.submit,
              destructive && styles.submitDestructive,
              (blocked || isSubmitting) && styles.submitDisabled,
            ]}
            onPress={() => onSubmit(trimmed)}
            disabled={blocked || isSubmitting}
          >
            <Text
              style={[
                styles.submitText,
                (blocked || isSubmitting) && styles.submitTextDisabled,
              ]}
            >
              {isSubmitting
                ? "Sending..."
                : blocked
                  ? "Add a reason"
                  : confirmLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  chipTextActive: { color: colors.accentText },
  input: {
    minHeight: 80,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 12,
    color: colors.textPrimary,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submit: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },
  submitDestructive: { backgroundColor: colors.danger },
  submitDisabled: { backgroundColor: colors.surfaceMuted },
  submitText: { color: colors.accentText, fontWeight: "600", fontSize: 15 },
  submitTextDisabled: { color: colors.textSecondary },
  back: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 14,
  },
});