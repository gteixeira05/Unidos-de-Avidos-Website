import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionFromCookieValue } from "@/lib/auth";
import GaleriaAlbumContent from "@/components/GaleriaAlbumContent";

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

      <GaleriaAlbumContent
        ano={ano}
        coverImageUrl={year.coverImageUrl}
        photos={dbPhotos}
        serverIsAdmin={isAdmin}
      />
    </div>
  );
}
