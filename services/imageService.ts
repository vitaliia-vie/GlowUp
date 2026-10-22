import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

type PickOptions = {
  maxWidth: number;
  quality: number;
  // Firestore document limit is 1 MiB, keep a safety margin
  maxLength: number;
};

async function pickSquareImage({
  maxWidth,
  quality,
  maxLength,
}: PickOptions): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const asset = result.assets[0];

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > maxWidth) {
    context.resize({ width: maxWidth });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: quality,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!saved.base64) {
    throw new Error("Could not process the image. Please try another one.");
  }

  const dataUri = `data:image/jpeg;base64,${saved.base64}`;
  if (dataUri.length > maxLength) {
    throw new Error("This image is too large. Please choose a smaller one.");
  }

  return dataUri;
}

export function pickPortfolioImage(): Promise<string | null> {
  return pickSquareImage({ maxWidth: 900, quality: 0.6, maxLength: 900_000 });
}

// Small square: it is stored inside the user's profile document
export function pickAvatarImage(): Promise<string | null> {
  return pickSquareImage({ maxWidth: 320, quality: 0.7, maxLength: 150_000 });
}