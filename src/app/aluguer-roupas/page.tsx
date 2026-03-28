import { Shirt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionFromCookieValue } from "@/lib/auth";
import AluguerCatalogContent from "@/components/AluguerCatalogContent";
import {
  ANOS_COM_ARCOS_ALUGUER,
  QUANTIDADE_ARCOS_POR_ANO,
} from "@/lib/aluguerRoupasPublic";

export const dynamic = "force-dynamic";

export default async function AluguerRoupasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ua_session")?.value;
  const session = await getSessionFromCookieValue(token);
  const isAdmin = session?.role === "ADMIN" || session?.isSuperAdmin === true;

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
          Catálogo das nossas fardas dos anos anteriores. Os preços de aluguer
          ainda não estão definidos; encontrará estimativas de stock e pode{" "}
          <a
            href="/fale-connosco"
            className="font-medium text-[#00923f] underline decoration-[#00923f]/35 underline-offset-2 hover:decoration-[#00923f]"
          >
            contactar-nos
          </a>{" "}
          para quantidades ao certo ou outras questões.
        </p>
      </div>

      <AluguerCatalogContent roupas={roupas} serverIsAdmin={isAdmin} />

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
