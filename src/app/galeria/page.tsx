import { prisma } from "@/lib/prisma";
import GaleriaIndexContent from "@/components/GaleriaIndexContent";

export const revalidate = 120;

export default async function GaleriaPage() {
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

      <GaleriaIndexContent years={years} serverIsAdmin={false} />
    </div>
  );
}
