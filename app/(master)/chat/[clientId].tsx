import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
    ChatMessage,
    ensureChatExists,
    sendMessage,
    subscribeToMessages
} from "@/services/chatApi";
import { db } from "@/services/firebaseConfig";
import { UserProfile } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function MasterChatScreen() {
  const { clientId, clientName: clientNameParam } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
  }>();
  const { profile } = useAuth();

  const [client, setClient] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const init = useCallback(async () => {
    if (!profile || !clientId) return;
    setIsLoading(true);
    try {
      const clientSnap = await getDoc(doc(db, "users", clientId));
      const clientData = clientSnap.exists()
        ? (clientSnap.data() as UserProfile)
        : null;
      setClient(clientData);

      const id = await ensureChatExists(
        clientId,
        clientData?.displayName ?? clientNameParam ?? "Client",
        profile.uid,
        profile.displayName,
      );
      setChatId(id);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to open chat.");
    } finally {
      setIsLoading(false);
    }
  }, [profile, clientId, clientNameParam]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!profile || !chatId || !text.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(chatId, profile.uid, profile.displayName, text.trim());
      setText("");
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: client?.displayName ?? clientNameParam ?? "Chat",
          headerBackTitle: "Back",
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet.</Text>
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === profile?.uid;
          return (
            <View
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              {!isMe && (
                <Text style={styles.bubbleSender}>{item.senderName}</Text>
              )}
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  bubbleMe: {
    backgroundColor: colors.accent,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bubbleText: { fontSize: 15, color: colors.textPrimary },
  bubbleTextMe: { color: colors.accentText },
  bubbleTime: {
    fontSize: 10,
    color: colors.textSecondary,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  bubbleTimeMe: { color: "rgba(255,255,255,0.7)" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: colors.surfaceMuted },
  sendButtonText: { color: colors.accentText, fontSize: 20, fontWeight: "700" },
});
