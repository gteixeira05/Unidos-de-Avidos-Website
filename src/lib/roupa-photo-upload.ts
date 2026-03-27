import {
  ROUPA_IMAGE_FORMAT_ERROR,
  galleryExtFromUpload,
  isAllowedGalleryUpload,
} from "./roupa-images";
import {
  dngFallbackCloudinaryFolder,
  isCloudinaryConfigured,
  tryUploadDngFallbackToCloudinaryEagerJpeg,
} from "./media/cloudinary";
import { storeProcessedWebImage } from "./media/store-web-image";
import { errorMessageForImageProcessing, normalizeGalleryImageForWeb } from "./gallery-upload-process";
import { MAX_ADMIN_IMAGE_UPLOAD_BYTES } from "./upload-limits";

export type PersistErr = { error: string; status: number };

export async function persistRoupaPhotoFile(
  roupaId: string,
  file: File,
  basename: string
): Promise<{ imageUrl: string } | PersistErr> {
  if (!isAllowedGalleryUpload(file)) {
    return { error: ROUPA_IMAGE_FORMAT_ERROR, status: 400 };
  }
  if (file.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
    return { error: "Cada ficheiro deve ter no máximo 100 MB.", status: 400 };
  }
  const logicalExt = galleryExtFromUpload(file);
  if (!logicalExt) {
    return { error: ROUPA_IMAGE_FORMAT_ERROR, status: 400 };
  }
  const bytes = await file.arrayBuffer();
  const inputBuf = Buffer.from(bytes);
  let outBuf: Buffer;
  let outExt: string;
  try {
    const processed = await normalizeGalleryImageForWeb(inputBuf, logicalExt);
    outBuf = processed.buffer;
    outExt = processed.ext;
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "DNG_CONVERSÃO" && isCloudinaryConfigured()) {
      const folder = dngFallbackCloudinaryFolder("roupa", { roupaId });
      const fallbackUrl = await tryUploadDngFallbackToCloudinaryEagerJpeg(inputBuf, {
        folder,
        publicId: `${basename}-dng-${Date.now()}`,
      });
      if (fallbackUrl) {
        return { imageUrl: fallbackUrl };
      }
    }
    return { error: errorMessageForImageProcessing(err), status: 400 };
  }

  const filename = `${basename}.${outExt}`;
  const stored = await storeProcessedWebImage(outBuf, outExt, {
    kind: "roupa",
    roupaId,
    filename,
  });
  return { imageUrl: stored.url };
}

export async function persistRoupaCoverFile(
  roupaId: string,
  file: File
): Promise<{ imageUrl: string } | PersistErr> {
  return persistRoupaPhotoFile(roupaId, file, "cover");
}
