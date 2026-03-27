import {
  GALLERY_IMAGE_FORMAT_ERROR,
  galleryExtFromUpload,
  isAllowedGalleryUpload,
} from "./gallery-images";
import {
  dngFallbackCloudinaryFolder,
  isCloudinaryConfigured,
  tryUploadDngFallbackToCloudinaryEagerJpeg,
} from "./media/cloudinary";
import { removeStoredMediaAsset } from "./media/remove-stored-asset";
import { storeProcessedWebImage } from "./media/store-web-image";
import { errorMessageForImageProcessing, normalizeGalleryImageForWeb } from "./gallery-upload-process";
import { MAX_ADMIN_IMAGE_UPLOAD_BYTES } from "./upload-limits";

export type PersistCoverError = { error: string; status: number };

/** Grava `cover.{ext}` em `public/galeria/{ano}/` ou no Cloudinary e devolve a URL pública. */
export async function persistGalleryCoverFromFile(
  ano: number,
  cover: File
): Promise<{ coverImageUrl: string } | PersistCoverError> {
  if (!isAllowedGalleryUpload(cover)) {
    return { error: GALLERY_IMAGE_FORMAT_ERROR, status: 400 };
  }
  if (cover.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
    return { error: "A capa deve ter no máximo 100 MB.", status: 400 };
  }
  const logicalExt = galleryExtFromUpload(cover);
  if (!logicalExt) {
    return { error: GALLERY_IMAGE_FORMAT_ERROR, status: 400 };
  }
  const bytes = await cover.arrayBuffer();
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
      const folder = dngFallbackCloudinaryFolder("galeria-cover", { ano });
      const fallbackUrl = await tryUploadDngFallbackToCloudinaryEagerJpeg(inputBuf, {
        folder,
        publicId: `cover-dng-${Date.now()}`,
      });
      if (fallbackUrl) {
        return { coverImageUrl: fallbackUrl };
      }
    }
    return { error: errorMessageForImageProcessing(err), status: 400 };
  }

  const stored = await storeProcessedWebImage(outBuf, outExt, { kind: "gallery-cover", ano });
  return { coverImageUrl: stored.url };
}

/** Remove ficheiro local ou asset Cloudinary a partir de uma URL guardada na BD. */
export async function unlinkPublicGalleryFile(urlPath: string): Promise<void> {
  await removeStoredMediaAsset(urlPath);
}
