import Link from "next/link";
import {
  ESTIMATIVA_QUANTIDADE_HOMEM,
  ESTIMATIVA_QUANTIDADE_MULHER,
  PRECO_ALUGUER_PUBLICO,
  QUANTIDADE_ARCOS_POR_ANO,
  temArcosParaAlugar,
} from "@/lib/aluguerRoupasPublic";

type Variant = "catalog" | "detail";

export function PrecoAluguerPublico({ className }: { className?: string }) {
  return (
    <span className={className} translate="no">
      {PRECO_ALUGUER_PUBLICO}
    </span>
  );
}

/** Grelha compacta Homem / Mulher com estimativas (catálogo). */
export function StockEstimativasCatalogo() {
  return (
    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
      <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Homem
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          ~{ESTIMATIVA_QUANTIDADE_HOMEM}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Mulher
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          ~{ESTIMATIVA_QUANTIDADE_MULHER}
        </span>
      </div>
    </div>
  );
}

function TextoContactoSobConsulta({ className }: { className?: string }) {
  return (
    <p className={className}>
      Se precisar de quantidades ao certo,{" "}
      <Link
        href="/fale-connosco"
        className="font-medium text-[#00923f] underline decoration-[#00923f]/35 underline-offset-2 hover:decoration-[#00923f]"
      >
        entre em contacto connosco
      </Link>
      : estão sob consulta.
    </p>
  );
}

export function BlocoStockCriancasArcos({
  ano,
  variant,
  omitContactoSobConsulta = false,
}: {
  ano: number;
  variant: Variant;
  /** Evita repetir o link quando o bloco pai já explica contacto/sob consulta. */
  omitContactoSobConsulta?: boolean;
}) {
  const gap = variant === "detail" ? "mt-3 space-y-3" : "mt-2 space-y-2";
  const textSize = variant === "detail" ? "text-sm" : "text-xs";

  return (
    <div className={gap}>
      {!omitContactoSobConsulta ? (
        <TextoContactoSobConsulta
          className={`${textSize} leading-relaxed text-gray-500`}
        />
      ) : null}
      <p className={`${textSize} leading-relaxed text-gray-600`}>
        Temos também roupas para crianças; as respetivas quantidades podem ser
        confirmadas ao entrarem em contacto connosco (sob consulta).
      </p>
      {temArcosParaAlugar(ano) ? (
        <p
          className={`rounded-lg border border-[#00923f]/20 bg-[#00923f]/[0.06] ${textSize} leading-relaxed text-gray-800 px-3 py-2`}
        >
          {QUANTIDADE_ARCOS_POR_ANO} arcos disponíveis para aluguer
        </p>
      ) : null}
    </div>
  );
}

/** Secção completa de stock na página de detalhe. */
export function StockFardasDetalhe({ ano }: { ano: number }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900">Stock de fardas</h4>
      <p className="mt-2 text-sm text-gray-600">
        Estimativas de conjuntos disponíveis por género (valores indicativos do
        inventário). As quantidades exatas estão sob consulta —{" "}
        <Link
          href="/fale-connosco"
          className="font-medium text-[#00923f] underline decoration-[#00923f]/35 underline-offset-2 hover:decoration-[#00923f]"
        >
          contacte-nos
        </Link>{" "}
        se precisar de números ao certo.
      </p>
      <div className="mt-3 flex max-w-sm gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="text-sm text-gray-600">Homem</span>
          <span className="text-lg font-semibold tabular-nums text-gray-900">
            ~{ESTIMATIVA_QUANTIDADE_HOMEM}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="text-sm text-gray-600">Mulher</span>
          <span className="text-lg font-semibold tabular-nums text-gray-900">
            ~{ESTIMATIVA_QUANTIDADE_MULHER}
          </span>
        </div>
      </div>
      <BlocoStockCriancasArcos
        ano={ano}
        variant="detail"
        omitContactoSobConsulta
      />
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        A disponibilidade nas datas que pretender depende sempre de confirmação
        após o pedido.
      </p>
    </div>
  );
}
