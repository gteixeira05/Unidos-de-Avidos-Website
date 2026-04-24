"use client";

import AdminGaleriaAnoControls from "@/components/admin/AdminGaleriaAnoControls";
import GaleriaRemovePhotoButton from "@/components/admin/GaleriaRemovePhotoButton";
import GaleriaSetCoverButton from "@/components/admin/GaleriaSetCoverButton";
import GaleriaAlbumGrid, { type GaleriaAlbumPhoto } from "@/components/GaleriaAlbumGrid";
import { useResolvedAdmin } from "@/hooks/useResolvedAdmin";

export type { GaleriaAlbumPhoto };

export default function GaleriaAlbumContent({
  ano,
  coverImageUrl,
  coverUpdatedAt,
  photos,
  serverIsAdmin,
}: {
  ano: string;
  coverImageUrl: string | null;
  coverUpdatedAt: string | Date;
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
          coverUpdatedAt={coverUpdatedAt}
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
        <GaleriaAlbumGrid
          ano={ano}
          photos={photos}
          adminFooter={
            isAdmin
              ? (p) => (
                  <>
                    <GaleriaSetCoverButton ano={ano} imageUrl={p.imageUrl} />
                    <GaleriaRemovePhotoButton photoId={p.id} />
                  </>
                )
              : undefined
          }
        />
      )}
    </>
  );
}
