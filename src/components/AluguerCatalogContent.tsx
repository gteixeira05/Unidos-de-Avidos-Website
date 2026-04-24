"use client";

import Link from "next/link";
import Image from "next/image";
import { Shirt } from "lucide-react";
import AdminRoupasControls from "@/components/admin/AdminRoupasControls";
import { tituloAluguerParaAno } from "@/lib/marchasAntoninas";
import { useResolvedAdmin } from "@/hooks/useResolvedAdmin";
import {
  BlocoStockCriancasArcos,
  PrecoAluguerRoupa,
  StockEstimativasCatalogo,
} from "@/components/AluguerRoupasInfoPublic";
import { temCalcadoDisponivel } from "@/lib/aluguerRoupasPublic";

export type RoupaCatalogRow = {
  id: string;
  ano: number;
  tema: string | null;
  descricao: string | null;
  precoAluguer: number;
  quantidadeHomem: number;
  quantidadeMulher: number;
  imagemUrl: string | null;
};

export default function AluguerCatalogContent({
  roupas,
  serverIsAdmin,
}: {
  roupas: RoupaCatalogRow[];
  serverIsAdmin: boolean;
}) {
  const isAdmin = useResolvedAdmin(serverIsAdmin);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {roupas.map((roupa, index) => (
        <div
          key={roupa.id}
          className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
        >
          <Link href={`/aluguer-roupas/${roupa.id}`} className="block">
            <div className="relative h-48 w-full overflow-hidden bg-gray-100">
              {roupa.imagemUrl ? (
                <Image
                  src={roupa.imagemUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index === 0}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Shirt
                    size={80}
                    className="text-[#00923f]/30 group-hover:text-[#00923f]/50"
                  />
                </div>
              )}
            </div>
            <div className="p-5">
              <span className="text-sm font-medium text-[#00923f]">
                Ano {roupa.ano}
              </span>
              <h3 className="mt-1 text-xl font-semibold text-gray-900">
                {tituloAluguerParaAno(roupa.ano, roupa.tema ?? "")}
              </h3>
              {temCalcadoDisponivel(roupa.ano) ? (
                <p className="mt-2 inline-flex rounded-full border border-[#00923f]/20 bg-[#00923f]/10 px-2.5 py-1 text-xs font-semibold text-[#007a33]">
                  Calçado disponível
                </p>
              ) : null}
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {roupa.descricao ?? ""}
                </p>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-bold text-[#00923f]">
                  <PrecoAluguerRoupa precoAluguer={roupa.precoAluguer} />
                </span>
                <span className="text-xs text-gray-500">Preço do aluguer</span>
              </div>
              <StockEstimativasCatalogo />
              <BlocoStockCriancasArcos ano={roupa.ano} variant="catalog" />
            </div>
          </Link>

          {isAdmin ? (
            <div className="border-t border-gray-100 px-5 py-4">
              <AdminRoupasControls roupaId={roupa.id} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
