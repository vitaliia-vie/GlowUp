import { colors, getAvatarUrl } from "@/constants/theme";
import { Image as ExpoImage } from "expo-image";
import { Image } from "react-native";

interface AvatarProps {
  displayName: string;
  size?: number;
  avatarUrl?: string | null;
}

export default function Avatar({
  displayName,
  size = 48,
  avatarUrl,
}: AvatarProps) {
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.surfaceMuted,
  };

  // The user's own photo
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={style} resizeMode="cover" />;
  }

  // Generated illustration (SVG) until a photo is chosen
  return (
    <ExpoImage
      source={{ uri: getAvatarUrl(displayName) }}
      style={style}
      contentFit="cover"
      transition={200}
    />
  );
}