import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { mediaAssetFolderPrefix } from "./asset-folder";
import { isCloudinaryConfigured, uploadImageBufferToCloudinary } from "./cloudinary";

export type StoreWebImageTarget =
  | { kind: "gallery"; ano: number; filename: string }
  | { kind: "gallery-cover"; ano: number }
  | { kind: "roupa"; roupaId: string; filename: string };

export type StoreWebImageResult = { url: string; storage: "local" | "cloudinary" };

/**
 * Grava imagem já normalizada (JPEG/PNG/WebP/GIF) em disco **ou** no Cloudinary,
 * conforme variáveis de ambiente. DNG deve ser convertido antes (Sharp ou fallback Cloudinary).
 */
export async function storeProcessedWebImage(
  buffer: Buffer,
  ext: string,
  target: StoreWebImageTarget
): Promise<StoreWebImageResult> {
  const safeExt = ext.toLowerCase() === "jpeg" ? "jpg" : ext.toLowerCase();

  if (isCloudinaryConfigured()) {
    const prefix = mediaAssetFolderPrefix();
    let folder: string;
    let publicId: string;
    let overwrite: boolean;

    if (target.kind === "gallery") {
      folder = `${prefix}/galeria/${target.ano}`;
      publicId = target.filename.replace(/\.[^.]+$/, "");
      overwrite = false;
    } else if (target.kind === "gallery-cover") {
      folder = `${prefix}/galeria/${target.ano}`;
      publicId = "cover";
      overwrite = true;
    } else {
      folder = `${prefix}/roupas/${target.roupaId}`;
      publicId = target.filename.replace(/\.[^.]+$/, "");
      overwrite = false;
    }

    const { secure_url } = await uploadImageBufferToCloudinary({
      buffer,
      folder,
      publicId,
      overwrite,
    });
    return { url: secure_url, storage: "cloudinary" };
  }

  if (target.kind === "gallery") {
    const dir = path.join(process.cwd(), "public", "galeria", String(target.ano));
    await mkdir(dir, { recursive: true });
    const filepath = path.join(dir, target.filename);
    await writeFile(filepath, buffer);
    return { url: `/galeria/${target.ano}/${target.filename}`, storage: "local" };
  }

  if (target.kind === "gallery-cover") {
    const dir = path.join(process.cwd(), "public", "galeria", String(target.ano));
    await mkdir(dir, { recursive: true });
    const filename = `cover.${safeExt}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    return { url: `/galeria/${target.ano}/${filename}`, storage: "local" };
  }

  const dir = path.join(process.cwd(), "public", "roupas", target.roupaId);
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, target.filename);
  await writeFile(filepath, buffer);
  return { url: `/roupas/${target.roupaId}/${target.filename}`, storage: "local" };
}
