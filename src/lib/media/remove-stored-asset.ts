import { unlink } from "fs/promises";
import path from "path";

import { destroyCloudinaryAssetByUrl, isCloudinaryImageUrl } from "./cloudinary";

/** Remove ficheiro local em `public/` ou asset no Cloudinary, conforme o formato da URL. */
export async function removeStoredMediaAsset(urlPath: string): Promise<void> {
  if (!urlPath) return;
  if (isCloudinaryImageUrl(urlPath)) {
    await destroyCloudinaryAssetByUrl(urlPath);
    return;
  }
  if (!urlPath.startsWith("/galeria/") && !urlPath.startsWith("/roupas/")) return;
  const rel = urlPath.replace(/^\//, "");
  const full = path.join(process.cwd(), "public", rel);
  try {
    await unlink(full);
  } catch {
    /* ficheiro já não existe */
  }
}
