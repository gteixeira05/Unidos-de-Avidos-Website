// Eventos da Agenda (geridos no admin; ver lib/conteudos.ts → getEventos).
export type Evento = {
  /** Identificador (id na BD). */
  slug: string;
  titulo: string;
  /** Data do evento no formato AAAA-MM-DD. */
  data: string;
  imagem: string;
  descricao: string;
};

/** Eventos de hoje em diante (hora de Lisboa), por ordem de data. */
export function proximosEventos(eventos: Evento[], agora = new Date()): Evento[] {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(agora); // AAAA-MM-DD
  return eventos.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
}

/** "10 de maio de 2026" */
export function formatarDataEvento(data: string): string {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${data}T00:00:00Z`)
  );
}
