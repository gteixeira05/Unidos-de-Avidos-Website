import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionFromCookieValue } from "@/lib/auth";
import AdminGaleriaAnoControls from "@/components/admin/AdminGaleriaAnoControls";
import GaleriaRemovePhotoButton from "@/components/admin/GaleriaRemovePhotoButton";
import GaleriaSetCoverButton from "@/components/admin/GaleriaSetCoverButton";

export const dynamic = "force-dynamic";

export default async function GaleriaAnoPage({
  params,
}: {
  params: Promise<{ ano: string }>;
}) {
  const { ano } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("ua_session")?.value;
  const session = await getSessionFromCookieValue(token);
  const isAdmin = session?.role === "ADMIN" || session?.isSuperAdmin === true;

  const year = await prisma.galleryYear.findUnique({
    where: { ano: Number(ano) },
    select: {
      id: true,
      ano: true,
      title: true,
      coverImageUrl: true,
      photos: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, imageUrl: true, caption: true },
      },
    },
  });

  if (!year) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/galeria"
          className="mb-6 inline-block text-sm font-medium text-[#00923f] hover:underline"
        >
          ← Voltar à Galeria
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Galeria {ano}</h1>
        <p className="mt-6 text-gray-700">
          Esta galeria não está disponível. Só são mostrados os álbuns criados na
          área de administração.
        </p>
      </div>
    );
  }

  const dbPhotos = year.photos;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/galeria"
        className="mb-6 inline-block text-sm font-medium text-[#00923f] hover:underline"
      >
        ← Voltar à Galeria
      </Link>

      <h1 className="text-3xl font-bold text-gray-900">Galeria {ano}</h1>
      <p className="mt-4 text-lg text-gray-600">
        {year.title
          ? year.title
          : `Fotografias das Marchas Antoninas — ${ano}.`}
      </p>

      {isAdmin ? (
        <AdminGaleriaAnoControls
          ano={ano}
          hasDbYear
          coverImageUrl={year.coverImageUrl}
        />
      ) : null}

      {dbPhotos.length === 0 ? (
        <div className="mt-10 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700">
            Ainda não há fotografias neste álbum.
          </p>
          {isAdmin ? (
            <p className="mt-2 text-sm text-gray-600">
              Use &quot;Adicionar fotos&quot; para enviar imagens. A foto de capa do
              álbum não aparece aqui — só as fotos que adicionares.
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Volte mais tarde.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dbPhotos.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={p.imageUrl}
                  alt={p.caption ?? `Foto ${ano}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              {isAdmin ? (
                <div className="border-t border-gray-100 bg-gray-50/80 p-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:bg-white/90">
                  <GaleriaSetCoverButton ano={ano} imageUrl={p.imageUrl} />
                  <GaleriaRemovePhotoButton photoId={p.id} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
