import InstagramCard from "@/components/InstagramCard";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

const PREVIEW_HEIGHT = 340;

// Matches https://www.instagram.com/<username>/embed (with or without www / trailing slash)
const EMBED_URL_PATTERN = /^https:\/\/(www\.)?instagram\.com\/[^/?#]+\/embed/i;

// Instagram may show a login form instead of the profile. If we see a
// password field, tell React Native so it can fall back to the simple card.
const DETECT_LOGIN_WALL = `
  (function () {
    if (document.querySelector('input[type="password"]')) {
      window.ReactNativeWebView.postMessage("login-wall");
    }
  })();
  true;
`;

type Props = {
  handle: string;
};

export default function InstagramPreview({ handle }: Props) {
  const [failed, setFailed] = useState(false);

  if (!handle) return null;

  // Web preview and any embed failure: fall back to the simple tappable card
  if (failed || Platform.OS === "web") {
    return <InstagramCard handle={handle} />;
  }

  const embedUrl = `https://www.instagram.com/${handle}/embed`;

  const openInstagram = async () => {
    try {
      await Linking.openURL(`https://instagram.com/${handle}`);
    } catch {
      Alert.alert("Error", "Could not open Instagram.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.header} onPress={openInstagram}>
        <Ionicons name="logo-instagram" size={22} color={colors.textPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.handle}>@{handle}</Text>
          <Text style={styles.hint}>Tap to open on Instagram</Text>
        </View>
        <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.previewWindow}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["https://*"]}
          injectedJavaScript={DETECT_LOGIN_WALL}
          onMessage={(event) => {
            if (event.nativeEvent.data === "login-wall") setFailed(true);
          }}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
          onShouldStartLoadWithRequest={(request) => {
            // Sub-frames (images, scripts) are fine
            if (request.isTopFrame === false) return true;
            if (request.url === "about:blank") return true;
            if (EMBED_URL_PATTERN.test(request.url)) return true;
            // Any other top-level navigation (e.g. redirect to login) -> fall back
            if (request.url.includes("login")) setFailed(true);
            return false;
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
        />
        {/* Transparent layer: any tap on the preview opens Instagram */}
        <Pressable style={styles.overlay} onPress={openInstagram} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  handle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  previewWindow: { height: PREVIEW_HEIGHT, backgroundColor: colors.surface },
  webview: { flex: 1, backgroundColor: colors.surface },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});