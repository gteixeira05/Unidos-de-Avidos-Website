import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Evento } from "@/lib/agenda";
import { CONTACTOS_PADRAO, type Contactos } from "@/lib/contactos";

export { telHref, whatsappUrl, type Contactos } from "@/lib/contactos";

/**
 * Conteúdos editáveis no admin (agenda, órgãos sociais, marchas, contactos).
 * Leitura com cache; o admin invalida com `revalidarConteudos()` (ver lib/conteudos-admin.ts).
 */
export const TAG_CONTEUDOS = "conteudos";

function emCache<T>(chave: string, fn: () => Promise<T>) {
  return unstable_cache(fn, [chave], { tags: [TAG_CONTEUDOS], revalidate: 3600 });
}

// ---------- Contactos ----------

export const getContactos = emCache("contactos", async (): Promise<Contactos> => {
  const row = await prisma.siteConfig.findUnique({ where: { chave: "contactos" } }).catch(() => null);
  return { ...CONTACTOS_PADRAO, ...((row?.valor as Partial<Contactos> | null) ?? {}) };
});

// ---------- Agenda ----------

export const getEventos = emCache("eventos", async (): Promise<Evento[]> => {
  const rows = await prisma.evento.findMany({ orderBy: { data: "asc" } }).catch(() => []);
  return rows.map((e) => ({
    slug: e.id,
    titulo: e.titulo,
    data: e.data.toISOString().slice(0, 10),
    imagem: e.imagemUrl ?? "",
    descricao: e.descricao ?? "",
  }));
});

// ---------- Órgãos sociais ----------

export const ORGAOS_SOCIAIS = [
  { id: "DIRECAO", nome: "Direção" },
  { id: "ASSEMBLEIA_GERAL", nome: "Assembleia Geral" },
  { id: "CONSELHO_FISCAL", nome: "Conselho Fiscal" },
] as const;

export type MembroOrgao = { orgao: string; cargo: string; nome: string };

export const getOrgaosSociais = emCache("orgaos", async (): Promise<MembroOrgao[]> => {
  const rows = await prisma.orgaoSocialMembro
    .findMany({ orderBy: [{ orgao: "asc" }, { ordem: "asc" }] })
    .catch(() => []);
  return rows.map(({ orgao, cargo, nome }) => ({ orgao, cargo, nome }));
});

// ---------- Marchas Antoninas ----------

export type MarchaClassificacaoItem = { pos: string; nome: string; pontos?: string; premios?: string };

export type MarchaAno = {
  ano: number;
  tema: string | null;
  descricaoCard: string | null;
  subtitulo: string | null;
  classificacao: MarchaClassificacaoItem[];
  mensagem: string | null;
  outros: { titulo: string; texto: string }[];
  youtubeUrl: string | null;
};

export const getMarchas = emCache("marchas", async (): Promise<MarchaAno[]> => {
  const rows = await prisma.marchaAno.findMany({ orderBy: { ano: "desc" } }).catch(() => []);
  return rows.map((m) => ({
    ano: m.ano,
    tema: m.tema,
    descricaoCard: m.descricaoCard,
    subtitulo: m.subtitulo,
    classificacao: (m.classificacao as MarchaClassificacaoItem[] | null) ?? [],
    mensagem: m.mensagem,
    outros: (m.outros as { titulo: string; texto: string }[] | null) ?? [],
    youtubeUrl: m.youtubeUrl,
  }));
});

export async function getMarcha(ano: number): Promise<MarchaAno | null> {
  return (await getMarchas()).find((m) => m.ano === ano) ?? null;
}

/** Título de uma roupa no aluguer: o tema oficial da Marcha desse ano, ou o tema da roupa. */
export function tituloAluguer(marchas: MarchaAno[], ano: number, temaRoupa: string | null): string {
  return marchas.find((m) => m.ano === ano)?.tema?.trim() || temaRoupa || "";
}
