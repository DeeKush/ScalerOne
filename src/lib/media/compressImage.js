import * as ImageManipulator from 'expo-image-manipulator';

// Longest edge and JPEG quality chosen to land comfortably under the
// server's 2 MB upload cap for a typical modern phone photo (often 3-8 MB
// straight off the camera), with real margin rather than right up against it.
const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.7;

/**
 * Resize + compress a picked photo before it's persisted/uploaded.
 * Returns a JPEG regardless of the source format, since that's the
 * predictable output `mime` for everything downstream.
 */
export async function compressPhoto(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return { uri: result.uri, mime: 'image/jpeg' };
}
