import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminTitulo from "@/components/admin/AdminTitulo";
import AdminRoupaFotosManager from "@/components/admin/AdminRoupaFotosManager";
import AdminRoupaInlineEditor from "@/components/admin/AdminRoupaInlineEditor";
import EliminarRoupaBotao from "@/components/admin/EliminarRoupaBotao";

export const dynamic = "force-dynamic";

/** Editor completo de uma roupa (o mesmo que aparece aos admins na página pública). */
export default async function AdminEditarRoupaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roupa = await prisma.roupa.findUnique({ where: { id } }).catch(() => null);
  if (!roupa) notFound();

  return (
    <div className="min-w-0 space-y-6">
      <Link href="/admin/roupas" className="text-sm font-medium text-[#00923f] hover:underline">
        ← Roupas
      </Link>
      <AdminTitulo
        titulo={`${roupa.ano} · ${roupa.tema}`}
        descricao="Preços, textos, stock, fotos e disponibilidade."
        acoes={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/aluguer-roupas/${roupa.id}`}
              target="_blank"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver no site ↗
            </Link>
            <EliminarRoupaBotao id={roupa.id} />
          </div>
        }
      />
      <AdminRoupaFotosManager roupaId={roupa.id} initialCoverUrl={roupa.imagemUrl} />
      <AdminRoupaInlineEditor
        roupa={{
          ...roupa,
          tudoIncluidoAte: roupa.tudoIncluidoAte?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
