import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSummary, subscribeToChats } from "@/services/chatApi";
import { getMasterProfile } from "@/services/mastersApi";
import { UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  // Where the back button goes if there is no previous screen
  homeHref: Href;
};

function formatTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesScreen({ homeHref }: Props) {
  const { profile } = useAuth();
  const router = useRouter();
  const uid = profile?.uid;

  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  // Profiles of the people we chat with (for their photos)
  const [people, setPeople] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!uid) return;
    return subscribeToChats(uid, setChats);
  }, [uid]);

  // Chats that were opened but never used have no message: hide them
  const visibleChats = useMemo(
    () =>
      (chats ?? [])
        .filter((chat) => chat.lastMessage !== "")
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    [chats],
  );

  const otherId = (chat: ChatSummary) =>
    chat.clientId === uid ? chat.masterId : chat.clientId;

  useEffect(() => {
    const missing = Array.from(
      new Set(
        visibleChats
          .map((chat) => (chat.clientId === uid ? chat.masterId : chat.clientId))
          .filter((id) => !people[id]),
      ),
    );
    if (missing.length === 0) return;

    let active = true;
    Promise.all(missing.map((id) => getMasterProfile(id)))
      .then((results) => {
        const found = results.filter((p): p is UserProfile => p !== null);
        if (!active || found.length === 0) return;
        setPeople((prev) => {
          const next = { ...prev };
          found.forEach((p) => {
            next[p.uid] = p;
          });
          return next;
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [visibleChats, people, uid]);

  const openChat = (chat: ChatSummary) => {
    if (chat.clientId === uid) {
      router.push({
        pathname: "/(client)/chat/[masterId]" as any,
        params: { masterId: chat.masterId, masterName: chat.masterName },
      });
    } else {
      router.push({
        pathname: "/(master)/chat/[clientId]" as any,
        params: { clientId: chat.clientId, clientName: chat.clientName },
      });
    }
  };

  return (
    <View style={styles.container}>
      <BackButton fallbackHref={homeHref} />
      <Text style={styles.header}>Messages</Text>

      {chats === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={visibleChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="chatbubbles-outline"
                size={34}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Open a master's page and tap the message button to start a
                chat.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const clientSide = item.clientId === uid;
            const name = clientSide ? item.masterName : item.clientName;
            const preview =
              (item.lastSenderId === uid ? "You: " : "") + item.lastMessage;

            return (
              <TouchableOpacity
                style={[styles.row, item.unread && styles.rowUnread]}
                activeOpacity={0.85}
                onPress={() => openChat(item)}
              >
                <Avatar
                  displayName={name}
                  avatarUrl={people[otherId(item)]?.avatarUrl}
                  size={48}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.time}>
                      {formatTime(item.lastMessageAt)}
                    </Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text
                      style={[styles.preview, item.unread && styles.previewUnread]}
                      numberOfLines={1}
                    >
                      {preview}
                    </Text>
                    {item.unread && <View style={styles.dot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
  emptyWrap: { alignItems: "center", marginTop: 48, gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  rowUnread: { borderColor: colors.accent },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  time: { fontSize: 11, color: colors.textSecondary },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  preview: { flex: 1, fontSize: 13, color: colors.textSecondary },
  previewUnread: { color: colors.textPrimary, fontWeight: "600" },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});