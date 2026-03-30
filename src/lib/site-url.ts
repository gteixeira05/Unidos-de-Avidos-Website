/**
 * URL pública do site (SEO, sitemap, emails).
 * Definir `APP_URL` (ex.: https://unidosdeavidos.pt) nas variáveis de ambiente de produção.
 *
 * Não usar `VERCEL_URL` como fallback: no deploy com domínio próprio o sitemap listaria
 * URLs em *.vercel.app e a Search Console reporta dezenas de erros no mapa do site.
 */
function normalizeSiteUrl(raw: string): string {
  let s = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  return s;
}

export function getSiteUrl(): string {
  const fromEnv =
    process.env.APP_URL?.trim() ?? process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return normalizeSiteUrl(fromEnv);
  }
  return "https://unidosdeavidos.pt";
}
