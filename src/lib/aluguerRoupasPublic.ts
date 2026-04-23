/** Textos e valores mostrados nas páginas públicas de aluguer de roupas. */

/** Formata o preço da BD para exibição pública (€, estilo português). */
export function formatPrecoAluguerPublico(preco: number): string {
  return `${Number(preco).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/** Estimativas de inventário (todas as coleções / anos). */
export const ESTIMATIVA_QUANTIDADE_MULHER = 55;
export const ESTIMATIVA_QUANTIDADE_HOMEM = 35;

/** Anos em que existem arcos para alugar (10 por ano). */
export const ANOS_COM_ARCOS_ALUGUER: readonly number[] = [2024, 2025];
export const QUANTIDADE_ARCOS_POR_ANO = 10;

export function temArcosParaAlugar(ano: number): boolean {
  return ANOS_COM_ARCOS_ALUGUER.includes(ano);
}
