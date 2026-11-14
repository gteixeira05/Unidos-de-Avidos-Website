import type { Metadata } from "next";

/** Recorta uma imagem do Cloudinary para 1200x630 (tamanho de partilha). Outras URLs ficam iguais. */
export function shareImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_1200,h_630,g_auto,q_auto,f_jpg/")
    : url;
}

/** Corta texto para descrições (~155 caracteres, sem partir palavras). */
export function shortText(text: string | null | undefined, max = 155): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(" ", max - 1)).replace(/[,.;:]$/, "") + "…";
}

/**
 * Metadata de uma página: título, descrição e partilha (Open Graph / Twitter).
 * Sem `image`, a partilha usa /og (foto do hero com o título por cima).
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const images = [opts.image ?? `/og?title=${encodeURIComponent(opts.title)}`];
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.path,
      siteName: "Unidos de Avidos",
      locale: "pt_PT",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
