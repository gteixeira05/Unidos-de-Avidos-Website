"use client";

import Image from "next/image";
import AdminGaleriaAnoControls from "@/components/admin/AdminGaleriaAnoControls";
import GaleriaRemovePhotoButton from "@/components/admin/GaleriaRemovePhotoButton";
import GaleriaSetCoverButton from "@/components/admin/GaleriaSetCoverButton";
import { useResolvedAdmin } from "@/hooks/useResolvedAdmin";

export type GaleriaAlbumPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export default function GaleriaAlbumContent({
  ano,
  coverImageUrl,
  photos,
  serverIsAdmin,
}: {
  ano: string;
  coverImageUrl: string | null;
  photos: GaleriaAlbumPhoto[];
  serverIsAdmin: boolean;
}) {
  const isAdmin = useResolvedAdmin(serverIsAdmin);

  return (
    <>
      {isAdmin ? (
        <AdminGaleriaAnoControls
          ano={ano}
          hasDbYear
          coverImageUrl={coverImageUrl}
        />
      ) : null}

      {photos.length === 0 ? (
        <div className="mt-10 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700">Ainda não há fotografias neste álbum.</p>
          {isAdmin ? (
            <p className="mt-2 text-sm text-gray-600">
              Use &quot;Adicionar fotos&quot; para enviar imagens. A foto de capa do
              álbum não aparece aqui — só as fotos que adicionares.
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Volte mais tarde.</p>
          )}
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
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
    </>
  );
}
