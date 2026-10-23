import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
    ComponentProps,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Alert,
    AlertButton,
    AlertOptions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];
type Tone = "success" | "error" | "warning" | "info";

type DialogRequest = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

const TONES: Record<
  Tone,
  { icon: IconName; color: string; background: string }
> = {
  success: {
    icon: "checkmark-circle-outline",
    color: "#2E8B57",
    background: "#E6F2EB",
  },
  error: {
    icon: "close-circle-outline",
    color: colors.danger,
    background: "#F6E6E3",
  },
  warning: {
    icon: "alert-circle-outline",
    color: "#B08A2E",
    background: "#F7EFD9",
  },
  info: {
    icon: "information-circle-outline",
    color: colors.accent,
    background: colors.surfaceMuted,
  },
};

// The host registers itself here, Alert.alert forwards requests to it
let enqueueDialog: ((request: DialogRequest) => void) | null = null;

// Picks the icon and colours from the wording of the title
function getTone(title: string, buttons: AlertButton[]): Tone {
  if (buttons.some((b) => b.style === "destructive")) return "warning";
  if (/^(saved|booked|done|success|updated|sent)\b/i.test(title)) {
    return "success";
  }
  if (/(error|failed|could not|not signed)/i.test(title)) return "error";
  if (/^(missing|invalid|select|no photo|choose|permission)/i.test(title)) {
    return "warning";
  }
  return "info";
}

// "Cancel" goes first (left), the main action last (right)
function normalizeButtons(buttons?: AlertButton[]): AlertButton[] {
  if (!buttons || buttons.length === 0) return [{ text: "OK" }];
  return [...buttons].sort(
    (a, b) => Number(b.style === "cancel") - Number(a.style === "cancel"),
  );
}

// Keep the real native alert so we can fall back to it, and so that a Fast
// Refresh of this file doesn't wrap our own replacement a second time.
const store = globalThis as any;
if (!store.__glowupNativeAlert) {
  store.__glowupNativeAlert = Alert.alert.bind(Alert);
}
const nativeAlert: typeof Alert.alert = store.__glowupNativeAlert;

// From now on every Alert.alert(...) in the app shows our dialog
Alert.alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) => {
  if (!enqueueDialog) {
    nativeAlert(title, message, buttons, options);
    return;
  }
  enqueueDialog({ title, message, buttons: normalizeButtons(buttons) });
};

export default function DialogHost() {
  const queue = useRef<DialogRequest[]>([]);
  const showing = useRef(false);
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [visible, setVisible] = useState(false);

  const showNext = useCallback(() => {
    if (showing.current) return;
    const next = queue.current.shift();
    if (!next) return;
    showing.current = true;
    setRequest(next);
    setVisible(true);
  }, []);

  useEffect(() => {
    enqueueDialog = (item) => {
      queue.current.push(item);
      showNext();
    };
    return () => {
      enqueueDialog = null;
    };
  }, [showNext]);

  const dismiss = (button?: AlertButton) => {
    showing.current = false;
    setVisible(false);
    button?.onPress?.();
    showNext();
  };

  // Tap outside the card or Android back button
  const handleBackdrop = () => {
    if (!request) return;
    const cancel = request.buttons.find((b) => b.style === "cancel");
    if (cancel) {
      dismiss(cancel);
    } else if (request.buttons.length === 1) {
      dismiss(request.buttons[0]);
    }
  };

  if (!request) return null;

  const tone = TONES[getTone(request.title, request.buttons)];
  const stacked = request.buttons.length > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdrop}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdrop}>
        {/* Swallows taps so pressing the card doesn't close it */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: tone.background }]}>
            <Ionicons name={tone.icon} size={28} color={tone.color} />
          </View>

          <Text style={styles.title}>{request.title}</Text>
          {request.message ? (
            <Text style={styles.message}>{request.message}</Text>
          ) : null}

          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {request.buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";

              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    !stacked && styles.buttonFlex,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => dismiss(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text ?? "OK"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 14,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  buttons: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 20 },
  buttonsStacked: { flexDirection: "column" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonFlex: { flex: 1 },
  buttonCancel: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDestructive: { backgroundColor: colors.danger },
  buttonText: { color: colors.accentText, fontWeight: "600", fontSize: 15 },
  buttonTextCancel: { color: colors.textPrimary },
});