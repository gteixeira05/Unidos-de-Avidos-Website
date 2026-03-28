"use client";

import Image from "next/image";
import Link from "next/link";
import AdminGaleriaControls, {
  AdminGaleriaYearCardShell,
} from "@/components/admin/AdminGaleriaControls";
import { useResolvedAdmin } from "@/hooks/useResolvedAdmin";

export type GaleriaYearRow = {
  id: string;
  ano: number;
  title: string | null;
  coverImageUrl: string | null;
};

export default function GaleriaIndexContent({
  years,
  serverIsAdmin,
}: {
  years: GaleriaYearRow[];
  serverIsAdmin: boolean;
}) {
  const isAdmin = useResolvedAdmin(serverIsAdmin);

  return (
    <>
      {isAdmin ? <AdminGaleriaControls /> : null}

      {years.length === 0 ? (
        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-700">
          <p>Ainda não há álbuns publicados.</p>
          {isAdmin ? (
            <p className="mt-2 text-sm text-gray-600">
              Use &quot;Criar novo álbum&quot; acima para adicionar o primeiro ano.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {years.map((y, index) => {
            const cover = y.coverImageUrl || "/hero-1.png";
            const coverSizes =
              "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

            if (isAdmin) {
              return (
                <AdminGaleriaYearCardShell
                  key={y.id}
                  ano={y.ano}
                  coverSrc={cover}
                  coverSizes={coverSizes}
                  coverPriority={index === 0}
                  dbYear={{
                    id: y.id,
                    ano: y.ano,
                    coverImageUrl: y.coverImageUrl,
                  }}
                />
              );
            }

            return (
              <Link
                key={y.id}
                href={`/galeria/${y.ano}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
              >
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={cover}
                    alt={`Galeria ${y.ano}`}
                    fill
                    sizes={coverSizes}
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/15" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900">{y.ano}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {y.title ? y.title : "Ver fotografias deste ano →"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
