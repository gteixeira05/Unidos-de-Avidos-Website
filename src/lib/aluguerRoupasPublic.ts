/** Preços do aluguer de roupas — regras únicas para o formulário, a API e o admin. */

/** Formata o preço da BD para exibição pública (€, estilo português). */
export function formatPrecoAluguerPublico(preco: number): string {
  return `${Number(preco).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/** Campos de preço de uma roupa (editáveis no admin). */
export type PrecosRoupa = {
  /** Preço base normal (figurino + acessórios). */
  precoAluguer: number;
  /** Acréscimo do calçado; `null` = sem calçado para alugar. */
  precoCalcado?: number | null;
  /** Acréscimo dos arcos; `null` = arcos não se alugam à parte. */
  precoArcos?: number | null;
  /** Arcos em stock (só informativo, ex.: "10 arcos disponíveis"). */
  arcosDisponiveis?: number | null;
  /** Preço fixo com tudo incluído (calçado e arcos), para reservas que começam antes de `tudoIncluidoAte`. */
  precoTudoIncluido?: number | null;
  tudoIncluidoAte?: Date | string | null;
};

/** "AAAA-MM-DD" de uma data (as datas de corte são guardadas à meia-noite UTC). */
function diaIso(d: Date | string): string {
  return (typeof d === "string" ? d : d.toISOString()).slice(0, 10);
}

function hojeLisboa(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(agora);
}

/**
 * A reserva usa o preço "tudo incluído"? Sem data escolhida, decide pela data de hoje.
 * @param dataInicio "AAAA-MM-DD" ou "".
 */
export function emModoTudoIncluido(r: PrecosRoupa, dataInicio: string, agora = new Date()): boolean {
  if (r.precoTudoIncluido == null || !r.tudoIncluidoAte) return false;
  return (dataInicio || hojeLisboa(agora)) < diaIso(r.tudoIncluidoAte);
}

export function temCalcado(r: PrecosRoupa): boolean {
  return r.precoCalcado != null;
}

export function temArcosOpcionais(r: PrecosRoupa): boolean {
  return r.precoArcos != null;
}

/** Preço a mostrar no catálogo/detalhe hoje. */
export function precoReferencia(r: PrecosRoupa, agora = new Date()): number {
  return emModoTudoIncluido(r, "", agora) ? Number(r.precoTudoIncluido) : Number(r.precoAluguer);
}

export type PrecoReserva = {
  tudoIncluido: boolean;
  precoBase: number;
  incluiCalcado: boolean;
  custoExtraCalcado: number;
  incluiArcos: boolean;
  custoExtraArcos: number;
  total: number;
};

/**
 * Preço de uma reserva. Em "tudo incluído", calçado e arcos são só para controlo de stock (custo 0);
 * caso contrário, cada extra só conta se a roupa o tiver.
 */
export function calcularPrecoReserva(
  r: PrecosRoupa,
  dataInicio: string,
  escolha: { calcado: boolean; arcos: boolean },
  agora = new Date()
): PrecoReserva {
  const tudoIncluido = emModoTudoIncluido(r, dataInicio, agora);
  const incluiCalcado = escolha.calcado && temCalcado(r);
  const incluiArcos = escolha.arcos && temArcosOpcionais(r);
  const precoBase = tudoIncluido ? Number(r.precoTudoIncluido) : Number(r.precoAluguer);
  const custoExtraCalcado = !tudoIncluido && incluiCalcado ? Number(r.precoCalcado) : 0;
  const custoExtraArcos = !tudoIncluido && incluiArcos ? Number(r.precoArcos) : 0;
  return {
    tudoIncluido,
    precoBase,
    incluiCalcado,
    custoExtraCalcado,
    incluiArcos,
    custoExtraArcos,
    total: precoBase + custoExtraCalcado + custoExtraArcos,
  };
}

/** Preço base de uma reserva já feita: o guardado na reserva ou, nas antigas, o atual da roupa. */
export function precoBaseDaReserva(r: { precoBase?: number | null; roupa: { precoAluguer: number } }): number {
  return Number(r.precoBase ?? r.roupa.precoAluguer);
}

/** Data de corte formatada ("1 de janeiro de 2027"). */
export function formatarDataCorte(d: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${diaIso(d)}T00:00:00Z`)
  );
}

/** Campos de preço a selecionar na BD (Prisma `select`). */
export const SELECT_PRECOS_ROUPA = {
  precoAluguer: true,
  precoCalcado: true,
  precoArcos: true,
  arcosDisponiveis: true,
  precoTudoIncluido: true,
  tudoIncluidoAte: true,
} as const;

/**
 * Lê os campos de preço enviados pelo admin. Campo ausente = não mexer; vazio/null = apagar.
 * Devolve `{ error }` se algum valor for inválido.
 */
export function lerPrecosDoBody(body: Record<string, unknown>):
  | { error: string }
  | { data: Partial<Omit<PrecosRoupa, "tudoIncluidoAte"> & { tudoIncluidoAte: Date | null }> } {
  const data: Record<string, unknown> = {};
  const opcional = (k: string, inteiro = false) => {
    if (!(k in body)) return true;
    const v = body[k];
    if (v === null || v === "") {
      data[k] = null;
      return true;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return false;
    data[k] = inteiro ? Math.floor(n) : n;
    return true;
  };
  if ("precoAluguer" in body) {
    const n = Number(body.precoAluguer);
    if (!Number.isFinite(n) || n < 0) return { error: "Preço base inválido." };
    data.precoAluguer = n;
  }
  if (!opcional("precoCalcado")) return { error: "Preço do calçado inválido." };
  if (!opcional("precoArcos")) return { error: "Preço dos arcos inválido." };
  if (!opcional("arcosDisponiveis", true)) return { error: "Número de arcos inválido." };
  if (!opcional("precoTudoIncluido")) return { error: "Preço tudo incluído inválido." };
  if ("tudoIncluidoAte" in body) {
    const v = body.tudoIncluidoAte;
    if (v === null || v === "") data.tudoIncluidoAte = null;
    else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.slice(0, 10)))
      data.tudoIncluidoAte = new Date(`${v.slice(0, 10)}T00:00:00Z`);
    else return { error: "Data do preço tudo incluído inválida." };
  }
  return { data };
}
