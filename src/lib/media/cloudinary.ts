import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { mediaAssetFolderPrefix } from "./asset-folder";

let initDone = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL?.trim() ||
      (process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
        process.env.CLOUDINARY_API_KEY?.trim() &&
        process.env.CLOUDINARY_API_SECRET?.trim())
  );
}

function getCloudinary(): typeof cloudinary | null {
  if (!isCloudinaryConfigured()) return null;
  if (!initDone) {
    initDone = true;
    if (process.env.CLOUDINARY_URL?.trim()) {
      cloudinary.config(true);
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
        api_key: process.env.CLOUDINARY_API_KEY!,
        api_secret: process.env.CLOUDINARY_API_SECRET!,
      });
    }
  }
  return cloudinary;
}

/** URL de entrega Cloudinary (imagens) — não inclui URLs com transformações arbitrárias no path guardado na BD. */
export function isCloudinaryImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (!u.hostname.endsWith("cloudinary.com")) return false;
    return u.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

/**
 * Extrai `public_id` (sem extensão) de URLs de upload padrão.
 * Funciona com URLs guardadas pela nossa API (`secure_url` sem transformações no path).
 */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("cloudinary.com")) return null;
    const m = u.pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (!m) return null;
    let rest = m[1];
    const lastDot = rest.lastIndexOf(".");
    const lastSlash = rest.lastIndexOf("/");
    if (lastDot > lastSlash) {
      rest = rest.slice(0, lastDot);
    }
    return rest || null;
  } catch {
    return null;
  }
}

export async function uploadImageBufferToCloudinary(opts: {
  buffer: Buffer;
  folder: string;
  publicId: string;
  overwrite?: boolean;
}): Promise<{ secure_url: string }> {
  const cl = getCloudinary();
  if (!cl) throw new Error("Cloudinary não configurado");
  const folder = opts.folder.replace(/^\/+|\/+$/g, "");
  return new Promise((resolve, reject) => {
    const stream = cl.uploader.upload_stream(
      {
        folder,
        public_id: opts.publicId,
        resource_type: "image",
        overwrite: opts.overwrite ?? false,
      },
      (err, result) => {
        if (err) reject(err);
        else if (result?.secure_url) resolve({ secure_url: result.secure_url });
        else reject(new Error("Cloudinary: resposta inválida"));
      }
    );
    Readable.from(opts.buffer).pipe(stream);
  });
}

export async function destroyCloudinaryAssetByUrl(secureUrl: string): Promise<void> {
  const cl = getCloudinary();
  if (!cl || !isCloudinaryImageUrl(secureUrl)) return;
  const publicId = cloudinaryPublicIdFromUrl(secureUrl);
  if (!publicId) return;
  try {
    await cl.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
  } catch {
    /* asset já removido ou URL não reconhecida */
  }
}

/**
 * Quando o Sharp não consegue ler o DNG (ex.: libvips sem suporte), tenta-se o Cloudinary
 * com `eager` para JPEG — mesmo fluxo recomendado quando se usa CDN.
 */
export async function tryUploadDngFallbackToCloudinaryEagerJpeg(
  buffer: Buffer,
  opts: { folder: string; publicId: string }
): Promise<string | null> {
  const cl = getCloudinary();
  if (!cl) return null;
  const folder = opts.folder.replace(/^\/+|\/+$/g, "");
  try {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cl.uploader.upload_stream(
        {
          folder,
          public_id: opts.publicId,
          resource_type: "auto",
          eager: [{ format: "jpg", quality: "auto", width: 4096, crop: "limit" }],
          eager_async: false,
        },
        (err, r) => (err ? reject(err) : resolve(r as UploadApiResponse))
      );
      Readable.from(buffer).pipe(stream);
    });
    const eager0 = result.eager?.[0] as { secure_url?: string } | undefined;
    if (eager0?.secure_url) return eager0.secure_url;
    if (result.secure_url) return result.secure_url;
    return null;
  } catch {
    return null;
  }
}

export function dngFallbackCloudinaryFolder(kind: "galeria-cover" | "galeria-photo" | "roupa", ctx: { ano?: number; roupaId?: string }): string {
  const prefix = mediaAssetFolderPrefix();
  if (kind === "galeria-cover" && ctx.ano != null) {
    return `${prefix}/galeria/${ctx.ano}`;
  }
  if (kind === "galeria-photo" && ctx.ano != null) {
    return `${prefix}/galeria/${ctx.ano}`;
  }
  if (kind === "roupa" && ctx.roupaId) {
    return `${prefix}/roupas/${ctx.roupaId}`;
  }
  return prefix;
}
