import {
  galleryExtFromFilename,
  isAllowedGalleryStoredFilename,
  isAllowedGalleryUpload,
  galleryExtFromUpload,
} from "./gallery-images";

export const ROUPA_IMAGE_FORMAT_ERROR =
  "Use JPG, PNG, WebP, GIF, HEIC/HEIF ou DNG (ProRAW Apple). Se o DNG falhar, exporte como JPG nas Fotos.";

/** Valida URL pública de imagem de roupa: `/roupas/{id}/ficheiro.ext` ou Cloudinary com pasta `roupas/{id}/`. */
export function isAllowedRoupaImageUrlPath(url: string): boolean {
  const pathOnly = url.split("?")[0].split("#")[0];
  if (pathOnly.startsWith("/roupas/")) {
    const seg = pathOnly.split("/").pop() ?? "";
    return isAllowedGalleryStoredFilename(seg);
  }
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (!u.hostname.endsWith("cloudinary.com")) return false;
    if (!u.pathname.includes("/image/upload/")) return false;
    const seg = u.pathname.split("/").pop() ?? "";
    return isAllowedGalleryStoredFilename(seg);
  } catch {
    return false;
  }
}

export function isRoupaImageUrlForRoupa(url: string, roupaId: string): boolean {
  if (!isAllowedRoupaImageUrlPath(url)) return false;
  const pathOnly = url.split("?")[0].split("#")[0];
  if (pathOnly.startsWith("/roupas/")) {
    return pathOnly.startsWith(`/roupas/${roupaId}/`);
  }
  const needle = `/roupas/${roupaId}/`;
  return pathOnly.includes(needle);
}

export function isDedicatedRoupaCoverFilename(url: string): boolean {
  const pathOnly = url.split("?")[0].split("#")[0];
  const seg = pathOnly.split("/").pop() ?? "";
  if (/^cover\.(jpe?g|png|webp|gif)$/i.test(seg)) return true;
  return /^cover-dng-\d+\.(jpe?g|png|webp|gif)$/i.test(seg);
}

export { isAllowedGalleryUpload, galleryExtFromUpload, galleryExtFromFilename };
