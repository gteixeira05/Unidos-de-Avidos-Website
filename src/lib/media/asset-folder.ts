/**
 * Prefixo de pastas no Cloudinary (ex.: `unidos-avidos/galeria/2025/...`).
 * Mantém os assets organizados e alinha com as validações de URL (`/galeria/`, `/roupas/` no path).
 */
export function mediaAssetFolderPrefix(): string {
  return (process.env.CLOUDINARY_ASSET_FOLDER?.trim() || "unidos-avidos").replace(/^\/+|\/+$/g, "");
}
