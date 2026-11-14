// Eventos da associação (Agenda e página inicial).
// Para acrescentar um evento, basta juntar uma entrada aqui; os passados deixam de aparecer sozinhos.
// ponytail: lista no código; passar para o admin quando houver muitos eventos (ver ANALISE-SITE.md, feature B).
export type Evento = {
  slug: string;
  titulo: string;
  /** Data do evento no formato AAAA-MM-DD. */
  data: string;
  imagem: string;
  descricao: string;
};

const EVENTOS: Evento[] = [
  {
    slug: "festa-da-flor-2026",
    titulo: "Festa da Flor",
    data: "2026-05-10",
    imagem: "/evento-festa-da-flor.png",
    descricao: "Celebração da Festa da Flor com a comunidade de Avidos.",
  },
  {
    slug: "marchas-antoninas-2026",
    titulo: "Marchas Antoninas",
    data: "2026-06-12",
    imagem: "/evento-marchas-antoninas.png",
    descricao: "Participação nas Marchas Antoninas de Vila Nova de Famalicão.",
  },
];

/** Eventos de hoje em diante (hora de Lisboa), por ordem de data. */
export function proximosEventos(agora = new Date()): Evento[] {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(agora); // AAAA-MM-DD
  return EVENTOS.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
}

/** "10 de maio de 2026" */
export function formatarDataEvento(data: string): string {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${data}T00:00:00Z`)
  );
}
