/** Valores persistidos em `Reserva.pagamentoEstado` / `Reserva.metodoPagamento`. */

export const PAGAMENTO_ESTADOS = ["POR_PAGAR", "PAGO"] as const;
export type PagamentoEstado = (typeof PAGAMENTO_ESTADOS)[number];

export const METODOS_PAGAMENTO = ["DINHEIRO_FISICO", "TRANSFERENCIA_BANCARIA"] as const;
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number];

export function normalizePagamentoEstado(v: string | null | undefined): PagamentoEstado {
  return v === "PAGO" ? "PAGO" : "POR_PAGAR";
}

export function labelPagamentoEstado(v: string | null | undefined): string {
  return normalizePagamentoEstado(v) === "PAGO" ? "Paga" : "Por pagar";
}

export function labelMetodoPagamento(v: string | null | undefined): string {
  if (v === "DINHEIRO_FISICO") return "Dinheiro físico";
  if (v === "TRANSFERENCIA_BANCARIA") return "Transferência bancária";
  return "—";
}

export function parseMetodoPagamento(
  raw: unknown
): MetodoPagamento | null {
  const s = (raw ?? "").toString().trim();
  if (s === "DINHEIRO_FISICO" || s === "TRANSFERENCIA_BANCARIA") return s;
  return null;
}
