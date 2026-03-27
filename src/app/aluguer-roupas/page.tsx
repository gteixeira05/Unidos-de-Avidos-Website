import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Shirt } from "lucide-react";
import { cookies } from "next/headers";
import { getSessionFromCookieValue } from "@/lib/auth";
import AdminRoupasControls from "@/components/admin/AdminRoupasControls";
import { tituloAluguerParaAno } from "@/lib/marchasAntoninas";

export default async function AluguerRoupasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ua_session")?.value;
  const session = await getSessionFromCookieValue(token);
  const isAdmin = session?.role === "ADMIN";

  const roupas = await prisma.roupa.findMany({
    orderBy: { ano: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Aluguer de Roupas
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Catálogo das nossas fardas dos anos anteriores. Cada roupa inclui
          informação sobre disponibilidade, preço e regras de utilização.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roupas.map((roupa) => (
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
                  {tituloAluguerParaAno(roupa.ano, roupa.tema)}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {roupa.descricao}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-[#00923f]">
                    {roupa.precoAluguer.toFixed(2)} €
                  </span>
                  <span className="text-sm text-gray-500">Preço fixo</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Homem
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                      {roupa.quantidadeHomem}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Mulher
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                      {roupa.quantidadeMulher}
                    </span>
                  </div>
                </div>
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

      {roupas.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <Shirt size={64} className="mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Nenhuma roupa disponível no momento.</p>
          <p className="mt-2 text-sm text-gray-500">
            Execute <code className="rounded bg-gray-200 px-2 py-1">npm run db:seed</code> para carregar dados de exemplo.
          </p>
        </div>
      )}
    </div>
  );
}
