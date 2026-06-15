import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { MARCHAS_INFO } from "@/lib/marchasAntoninas";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/sobre", priority: 0.9, changeFrequency: "monthly" },
  { path: "/sobre/historia", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sobre/marchas", priority: 0.9, changeFrequency: "weekly" },
  { path: "/sobre/orgaos-sociais", priority: 0.7, changeFrequency: "monthly" },
  { path: "/galeria", priority: 0.9, changeFrequency: "weekly" },
  { path: "/agenda", priority: 0.8, changeFrequency: "weekly" },
  { path: "/aluguer-roupas", priority: 0.9, changeFrequency: "weekly" },
  { path: "/fale-connosco", priority: 0.8, changeFrequency: "monthly" },
  { path: "/socio", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tornar-socio", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacidade", priority: 0.3, changeFrequency: "yearly" },
  { path: "/politica-cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/termos", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const marchasAnos = Object.keys(MARCHAS_INFO).map(Number);
  const marchasEntries: MetadataRoute.Sitemap = marchasAnos.map((ano) => ({
    url: `${base}/sobre/marchas/${ano}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  let galleryEntries: MetadataRoute.Sitemap = [];
  let aluguerEntries: MetadataRoute.Sitemap = [];
  try {
    const [years, roupas] = await Promise.all([
      prisma.galleryYear.findMany({ select: { ano: true } }),
      prisma.roupa.findMany({ select: { id: true } }),
    ]);
    galleryEntries = years.map((y) => ({
      url: `${base}/galeria/${y.ano}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    aluguerEntries = roupas.map((r) => ({
      url: `${base}/aluguer-roupas/${r.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    /* build/ambiente sem BD: mantém só rotas estáticas */
  }

  return [...staticEntries, ...marchasEntries, ...galleryEntries, ...aluguerEntries];
}
