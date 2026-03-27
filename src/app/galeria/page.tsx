import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionFromCookieValue } from "@/lib/auth";
import AdminGaleriaControls, {
  AdminGaleriaYearCardShell,
} from "@/components/admin/AdminGaleriaControls";

export default async function GaleriaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ua_session")?.value;
  const session = await getSessionFromCookieValue(token);
  const isAdmin = session?.role === "ADMIN";

  const years = await prisma.galleryYear.findMany({
    orderBy: { ano: "desc" },
    select: { id: true, ano: true, title: true, coverImageUrl: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Galeria</h1>
      <p className="mt-4 text-lg text-gray-600">
        Fotografias das nossas participações nas Marchas Antoninas, organizadas
        por ano.
      </p>

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
          {years.map((y) => {
            const cover = y.coverImageUrl || "/hero-1.png";

            if (isAdmin) {
              return (
                <AdminGaleriaYearCardShell
                  key={y.id}
                  ano={y.ano}
                  coverSrc={cover}
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
    </div>
  );
}
