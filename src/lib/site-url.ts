/**
 * URL pública do site (SEO, sitemap, emails). Definir APP_URL em produção, ex.: https://unidosdeavidos.pt
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://unidosdeavidos.pt";
}
