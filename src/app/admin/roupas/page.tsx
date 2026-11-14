import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { formatPrecoAluguerPublico, precoReferencia } from "@/lib/aluguerRoupasPublic";

export const dynamic = "force-dynamic";

export default async function AdminRoupasPage() {
  const roupas = await prisma.roupa.findMany({ orderBy: { ano: "desc" } });

  return (
    <div className="min-w-0">
      <AdminTitulo
        titulo="Roupas"
        descricao="Catálogo de aluguer: preços, fotos, stock e disponibilidade."
        acoes={
          <Link
            href="/admin/roupas/novo"
            className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
          >
            + Nova roupa
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Ano</th>
              <th className="px-4 py-3 font-semibold">Tema</th>
              <th className="px-4 py-3 font-semibold">Preço atual</th>
              <th className="px-4 py-3 font-semibold">Extras</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roupas.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold tabular-nums">{r.ano}</td>
                <td className="px-4 py-3 text-gray-900">{r.tema}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {formatPrecoAluguerPublico(precoReferencia(r))}
                  {r.precoTudoIncluido != null && r.tudoIncluidoAte && precoReferencia(r) === r.precoTudoIncluido && (
                    <span className="ml-1 text-xs text-gray-500">(tudo incluído)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {[
                    r.precoCalcado != null && `Calçado +${formatPrecoAluguerPublico(r.precoCalcado)}`,
                    r.precoArcos != null && `Arcos +${formatPrecoAluguerPublico(r.precoArcos)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/roupas/${r.id}`} className="whitespace-nowrap font-medium text-[#00923f] hover:underline">
                    Editar →
                  </Link>
                </td>
              </tr>
            ))}
            {!roupas.length && (
              <tr>
                <td className="px-4 py-6 text-gray-600" colSpan={5}>
                  Ainda não existem roupas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
