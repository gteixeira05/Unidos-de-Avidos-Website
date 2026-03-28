/** Textos e valores mostrados nas páginas públicas de aluguer de roupas. */

export const PRECO_ALUGUER_PUBLICO = "Ainda não estão definidos";

/** Estimativas de inventário (todas as coleções / anos). */
export const ESTIMATIVA_QUANTIDADE_MULHER = 55;
export const ESTIMATIVA_QUANTIDADE_HOMEM = 35;

/** Anos em que existem arcos para alugar (10 por ano). */
export const ANOS_COM_ARCOS_ALUGUER: readonly number[] = [2024, 2025];
export const QUANTIDADE_ARCOS_POR_ANO = 10;

export function temArcosParaAlugar(ano: number): boolean {
  return ANOS_COM_ARCOS_ALUGUER.includes(ano);
}
