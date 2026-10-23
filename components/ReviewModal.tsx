import StarRating from "@/components/StarRating";
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
  masterName: string;
  serviceName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
};

export default function ReviewModal({
  visible,
  masterName,
  serviceName,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Start fresh every time the window opens
  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment("");
    }
  }, [visible]);

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
          <Text style={styles.title}>Rate your visit</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {serviceName} with {masterName}
          </Text>

          <View style={styles.starsWrap}>
            <StarRating value={rating} size={36} onChange={setRating} />
          </View>

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell others about your experience (optional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />

          <TouchableOpacity
            style={[styles.submit, rating === 0 && styles.submitDisabled]}
            onPress={() => onSubmit(rating, comment.trim())}
            disabled={rating === 0 || isSubmitting}
          >
            <Text
              style={[
                styles.submitText,
                rating === 0 && styles.submitTextDisabled,
              ]}
            >
              {isSubmitting
                ? "Sending..."
                : rating === 0
                  ? "Choose a rating"
                  : "Send review"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Text style={styles.cancel}>Cancel</Text>
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
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  starsWrap: { marginVertical: 18 },
  input: {
    alignSelf: "stretch",
    minHeight: 90,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submit: {
    alignSelf: "stretch",
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },
  submitDisabled: { backgroundColor: colors.surfaceMuted },
  submitText: { color: colors.accentText, fontWeight: "600", fontSize: 15 },
  submitTextDisabled: { color: colors.textSecondary },
  cancel: { color: colors.textSecondary, fontWeight: "600", marginTop: 14 },
});