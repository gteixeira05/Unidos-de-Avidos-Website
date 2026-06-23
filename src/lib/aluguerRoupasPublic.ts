/** Textos e valores mostrados nas páginas públicas de aluguer de roupas. */

/** Formata o preço da BD para exibição pública (€, estilo português). */
export function formatPrecoAluguerPublico(preco: number): string {
  return `${Number(preco).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/** Anos em que existem arcos para alugar (10 por ano). */
export const ANOS_COM_ARCOS_ALUGUER: readonly number[] = [2024, 2025, 2026];
export const QUANTIDADE_ARCOS_POR_ANO = 10;

export function temArcosParaAlugar(ano: number): boolean {
  return ANOS_COM_ARCOS_ALUGUER.includes(ano);
}

/** Preços extra para aluguer de calçado por ano. */
export const PRECO_CALCADO_POR_ANO: Readonly<Record<number, number>> = {
  2017: 100,
  2018: 100,
  2019: 150,
  2024: 150,
  2025: 150,
};

export function getPrecoCalcadoPorAno(ano: number): number | null {
  return PRECO_CALCADO_POR_ANO[ano] ?? null;
}

export function temCalcadoDisponivel(ano: number): boolean {
  return getPrecoCalcadoPorAno(ano) !== null;
}

/** Preços especiais para a roupa de 2026 em reservas com início a partir de 2027-01-01. */
export const PRECO_BASE_POS_EVENTO_2026 = 1600;
export const PRECO_CALCADO_POS_EVENTO_2026 = 200;
export const PRECO_ARCOS_POS_EVENTO_2026 = 200;

/** Devolve true se a reserva deve usar o modelo de preços pós-evento 2026. */
export function isPosEvento2026(ano: number, dataInicioStr: string): boolean {
  return ano === 2026 && dataInicioStr !== "" && dataInicioStr >= "2027-01-01";
}
