import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_WIDTH = 900;
const JPEG_QUALITY = 0.6;
// Firestore document limit is 1 MiB, keep a safety margin
const MAX_DATA_URI_LENGTH = 900_000;

export async function pickPortfolioImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const asset = result.assets[0];

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) {
    context.resize({ width: MAX_WIDTH });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!saved.base64) {
    throw new Error("Could not process the image. Please try another one.");
  }

  const dataUri = `data:image/jpeg;base64,${saved.base64}`;
  if (dataUri.length > MAX_DATA_URI_LENGTH) {
    throw new Error("This image is too large. Please choose a smaller one.");
  }

  return dataUri;
}