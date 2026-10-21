import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import { DEV_TEST_MASTER } from "@/constants/devAccounts";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const STORAGE_KEY = "glowup_dev_test_masters";
const TEST_PASSWORD = "test1234";

type TestMaster = {
  email: string;
  password: string;
  displayName: string;
};

export default function DevMastersScreen() {
  const { profile, signIn, signUp } = useAuth();
  const router = useRouter();

  const [savedMasters, setSavedMasters] = useState<TestMaster[]>([]);
  const [name, setName] = useState("");
  // Email of the account being switched to, or "creating"
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSavedMasters(JSON.parse(raw));
      } catch {
        // Nothing saved yet, or storage unavailable: start with an empty list
      }
    })();
  }, []);

  const persist = async (list: TestMaster[]) => {
    setSavedMasters(list);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Not critical for a dev tool
    }
  };

  const accounts: TestMaster[] = [
    {
      email: DEV_TEST_MASTER.email,
      password: DEV_TEST_MASTER.password,
      displayName: "Main test master",
    },
    ...savedMasters,
  ];

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Missing name", "Enter a name for the new test master.");
      return;
    }

    const email = `test.master.${Date.now().toString(36)}@glowup.dev`;
    setBusy("creating");
    try {
      // Registers the account and signs in as it
      await signUp(email, TEST_PASSWORD, trimmed, "master");
      await persist([
        ...savedMasters,
        { email, password: TEST_PASSWORD, displayName: trimmed },
      ]);
      setName("");
    } catch (error: any) {
      Alert.alert(
        "Could not create master",
        error.message ?? "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSwitch = async (account: TestMaster) => {
    setBusy(account.email);
    try {
      await signIn(account.email, account.password);
      router.replace("/(master)");
    } catch (error: any) {
      Alert.alert("Could not switch", error.message ?? "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = (account: TestMaster) => {
    Alert.alert(
      "Remove from list",
      `Remove "${account.displayName}" from this list? The account itself stays in Firebase.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            persist(savedMasters.filter((m) => m.email !== account.email)),
        },
      ],
    );
  };

  // Safety net: this screen is only reachable from a dev-only button
  if (!__DEV__) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <BackButton fallbackHref="/(master)" />

      <View style={styles.devBadge}>
        <Text style={styles.devBadgeText}>DEV ONLY</Text>
      </View>
      <Text style={styles.header}>Test masters</Text>
      <Text style={styles.subheader}>
        Create extra master accounts and switch between them to test the app.
      </Text>

      <Text style={styles.sectionTitle}>Create a new test master</Text>
      <View style={styles.createCard}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Master name, e.g. Anna Nails"
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[styles.createButton, busy !== null && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={busy !== null}
        >
          {busy === "creating" ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.createButtonText}>Create and sign in</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>
          The new master signs in right away. Add their services, photos and
          availability from their own profile.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Switch to a master</Text>
      {accounts.map((account, index) => {
        const isCurrent = profile?.email === account.email;
        const isMain = index === 0;

        return (
          <View
            key={account.email}
            style={[styles.accountRow, isCurrent && styles.accountRowCurrent]}
          >
            <Avatar displayName={account.displayName} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName} numberOfLines={1}>
                {account.displayName}
              </Text>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {account.email}
              </Text>
            </View>

            {isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => handleSwitch(account)}
                disabled={busy !== null}
              >
                {busy === account.email ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={styles.switchButtonText}>Switch</Text>
                )}
              </TouchableOpacity>
            )}

            {!isMain && (
              <TouchableOpacity
                onPress={() => handleRemove(account)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
  devBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  devBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  header: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  subheader: { color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  createCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonText: { color: colors.accentText, fontWeight: "600" },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 10 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountRowCurrent: { borderColor: colors.accent },
  accountName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  accountEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  currentBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  currentBadgeText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "700",
  },
  switchButton: {
    minWidth: 64,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  switchButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
});