import { colors, getAvatarUrl } from '@/constants/theme';
import { Image } from 'expo-image';

interface AvatarProps {
  displayName: string;
  size?: number;
  avatarUrl?: string | null;
}

export default function Avatar({ displayName, size = 48, avatarUrl }: AvatarProps) {
  const uri = avatarUrl || getAvatarUrl(displayName);

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceMuted }}
      contentFit="cover"
      transition={200}
    />
  );
}