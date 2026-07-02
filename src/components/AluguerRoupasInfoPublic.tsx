import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  formatPrecoAluguerPublico,
  QUANTIDADE_ARCOS_POR_ANO,
  temArcosParaAlugar,
} from "@/lib/aluguerRoupasPublic";

type Variant = "catalog" | "detail";

/** Política de caução de 100 € — fonte única do texto, reutilizada no detalhe e no formulário. */
export function PoliticaCaucao({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className ?? ""}`}
    >
      <div className="flex items-start gap-2">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-semibold text-amber-900">Caução de 100&nbsp;€</p>
          <p className="mt-1 leading-relaxed text-amber-800">
            Todos os alugueres de roupa passam a incluir uma caução de{" "}
            <strong className="font-semibold">100&nbsp;€</strong>, devolvida na
            totalidade desde que:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
            <li>
              A roupa nos seja entregue{" "}
              <strong className="font-semibold">
                no máximo até 2 dias após a sua utilização
              </strong>{" "}
              (salvo exceções acordadas connosco);
            </li>
            <li>
              A roupa venha <strong className="font-semibold">lavada</strong> no
              momento da entrega;
            </li>
            <li>
              A roupa seja entregue{" "}
              <strong className="font-semibold">em boas condições</strong>.
            </li>
          </ul>
          <p className="mt-2 leading-relaxed text-amber-800">
            Caso alguma destas condições não seja cumprida,{" "}
            <strong className="font-semibold">
              a caução não será devolvida
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function PrecoAluguerRoupa({
  precoAluguer,
  className,
}: {
  precoAluguer: number;
  className?: string;
}) {
  return (
    <span className={className} translate="no">
      {formatPrecoAluguerPublico(precoAluguer)}
    </span>
  );
}

/** Grelha compacta Homem / Mulher com estimativas (catálogo). */
export function StockEstimativasCatalogo({
  quantidadeHomem,
  quantidadeMulher,
}: {
  quantidadeHomem: number;
  quantidadeMulher: number;
}) {
  return (
    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
      <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Homem
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          ~{quantidadeHomem}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Mulher
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          ~{quantidadeMulher}
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
export function StockFardasDetalhe({
  ano,
  quantidadeHomem,
  quantidadeMulher,
}: {
  ano: number;
  quantidadeHomem: number;
  quantidadeMulher: number;
}) {
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
            ~{quantidadeHomem}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="text-sm text-gray-600">Mulher</span>
          <span className="text-lg font-semibold tabular-nums text-gray-900">
            ~{quantidadeMulher}
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
