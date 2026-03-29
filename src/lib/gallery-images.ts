/**
 * Formatos aceites no upload (convertidos no servidor para formatos web).
 * DNG (ProRAW Apple) é convertido para JPEG no servidor quando possível.
 */
export const GALLERY_IMAGE_FORMAT_ERROR =
  "Use JPG, PNG, WebP, GIF, HEIC/HEIF ou DNG (ProRAW Apple). Se um DNG não converter, exporte como JPG nas Fotos.";

/**
 * Valor de `accept` em inputs de ficheiro (galeria admin).
 * Evita Safari/iOS a lançar "The string did not match the expected pattern." com listas longas
 * de MIME não standard (ex.: `image/dng`, `application/octet-stream`). A validação real é
 * `isAllowedGalleryUpload` na API.
 */
export const GALLERY_FILE_INPUT_ACCEPT = "image/*,.dng";

/** Extensões que o admin pode enviar (inclui HEIC/HEIF e DNG ProRAW). */
const ALLOWED_UPLOAD = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "dng"]);

/** Extensões guardadas em disco / URLs públicas (após conversão). */
const ALLOWED_STORED = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function galleryExtFromFilename(name: string): string {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function mimeToGalleryExt(mime: string): string {
  const m = mime.toLowerCase().split(";")[0].trim();
  switch (m) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "image/dng":
    case "image/x-adobe-dng":
    case "image/x-raw":
      return "dng";
    default:
      return "";
  }
}

/**
 * Resolve o tipo lógico do ficheiro (nome + MIME do browser).
 * Útil quando o iPhone envia HEIC com MIME correto mas nome estranho.
 */
export function galleryExtFromUpload(file: { name: string; type?: string }): string {
  const fromName = galleryExtFromFilename(file.name);
  if (fromName) {
    const n = fromName === "jpeg" ? "jpg" : fromName;
    if (ALLOWED_UPLOAD.has(fromName) || fromName === "jpeg") {
      return n;
    }
  }
  const fromMime = mimeToGalleryExt(file.type ?? "");
  if (fromMime && ALLOWED_UPLOAD.has(fromMime)) {
    return fromMime;
  }
  return "";
}

export function isAllowedGalleryUpload(file: { name: string; type?: string }): boolean {
  const ext = galleryExtFromUpload(file);
  if (!ext) return false;
  return ALLOWED_UPLOAD.has(ext);
}

/** Ficheiros já na galeria (URLs) — só formatos servidos na web. */
export function isAllowedGalleryStoredFilename(name: string): boolean {
  const ext = galleryExtFromFilename(name);
  if (!ext) return false;
  return ALLOWED_STORED.has(ext);
}

/** URL HTTPS de entrega Cloudinary (imagem), sem transformações no path guardado na BD. */
export function isCloudinaryGalleryImageUrl(url: string): boolean {
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

/** Valida o último segmento de um path ou URL (ex.: /galeria/2025/foto.jpg ou Cloudinary). */
export function isAllowedGalleryImageUrlPath(url: string): boolean {
  const pathOnly = url.split("?")[0].split("#")[0];
  if (pathOnly.startsWith("/")) {
    const seg = pathOnly.split("/").pop() ?? "";
    return isAllowedGalleryStoredFilename(seg);
  }
  return isCloudinaryGalleryImageUrl(url);
}

/** A URL de imagem pertence à pasta do ano (ex.: capa ou fotos do mesmo álbum). */
export function isGalleryImageUrlForYear(url: string, ano: number): boolean {
  if (!isAllowedGalleryImageUrlPath(url)) return false;
  const pathOnly = url.split("?")[0].split("#")[0];
  if (pathOnly.startsWith("/galeria/")) {
    const prefix = `/galeria/${ano}/`;
    return pathOnly.startsWith(prefix);
  }
  if (isCloudinaryGalleryImageUrl(url)) {
    const needle = `/galeria/${ano}/`;
    return pathOnly.includes(needle);
  }
  return false;
}

/** Ficheiro dedicado `cover.jpg` (etc.) ou capa vinda do fallback DNG → Cloudinary — pode ser removido ao substituir a capa por upload. */
export function isDedicatedCoverFilename(url: string): boolean {
  const pathOnly = url.split("?")[0].split("#")[0];
  const seg = pathOnly.split("/").pop() ?? "";
  if (/^cover\.(jpe?g|png|webp|gif)$/i.test(seg)) return true;
  return /^cover-dng-\d+\.(jpe?g|png|webp|gif)$/i.test(seg);
}
