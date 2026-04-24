import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CalendarioDisponibilidade from "./CalendarioDisponibilidade";
import FormularioReserva from "./FormularioReserva";
import RoupaDetailAdminSection from "@/components/RoupaDetailAdminSection";
import RoupaFotosGaleria from "@/components/RoupaFotosGaleria";
import { tituloAluguerParaAno } from "@/lib/marchasAntoninas";
import { PrecoAluguerRoupa, StockFardasDetalhe } from "@/components/AluguerRoupasInfoPublic";
import { temCalcadoDisponivel } from "@/lib/aluguerRoupasPublic";

export const revalidate = 120;

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default async function RoupaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const roupa = await prisma.roupa.findUnique({
    where: { id },
    include: {
      photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!roupa) {
    notFound();
  }

  const tituloExibicao = tituloAluguerParaAno(roupa.ano, roupa.tema);

  const galeriaPhotos =
    roupa.photos.length > 0
      ? roupa.photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl }))
      : roupa.imagemUrl
        ? [{ id: "cover-only", imageUrl: roupa.imagemUrl }]
        : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/aluguer-roupas"
        className="mb-6 inline-block text-sm font-medium text-[#00923f] hover:underline"
      >
        ← Voltar ao catálogo
      </Link>

      <div className="grid min-w-0 gap-8 lg:grid-cols-3">
        {/* Informações da roupa */}
        <div className="min-w-0 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-medium text-[#00923f]">
              Ano {roupa.ano}
            </span>
            {temCalcadoDisponivel(roupa.ano) ? (
              <p className="mt-2 inline-flex rounded-full border border-[#00923f]/20 bg-[#00923f]/10 px-2.5 py-1 text-xs font-semibold text-[#007a33]">
                Calçado disponível
              </p>
            ) : null}
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {tituloExibicao}
            </h1>
            <p className="mt-4 text-gray-600">{roupa.descricao}</p>

            <div className="mt-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Condição de aluguer</h4>
                <p className="text-sm text-gray-600">
                  O preço de referência abaixo é o valor do aluguer,
                  independentemente da quantidade de fardas levantadas. A
                  reserva sujeita-se a aprovação e confirmação de stock pela
                  equipa.
                </p>
              </div>
              {roupa.conjuntoInclui && (
                <div>
                  <h4 className="font-semibold text-gray-900">O aluguer inclui</h4>
                  <p className="text-sm text-gray-600">{roupa.conjuntoInclui}</p>
                </div>
              )}
              {roupa.regrasLavagem && (
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Regras de lavagem/estado
                  </h4>
                  <p className="text-sm text-gray-600">{roupa.regrasLavagem}</p>
                </div>
              )}

              <StockFardasDetalhe ano={roupa.ano} />
            </div>

            <p className="mt-6 text-xl font-bold text-[#00923f]">
              <PrecoAluguerRoupa precoAluguer={roupa.precoAluguer} />
            </p>

            <a
              href={`https://wa.me/351914884537?text=${encodeURIComponent(`Quero saber mais informações acerca da roupa de ${roupa.ano}!`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-medium text-white transition-colors hover:bg-[#20BD5A]"
            >
              <WhatsappIcon className="h-5 w-5" />
              Saber mais informações
            </a>
          </div>
        </div>

        {/* Fotos, calendário e formulário — min-w-0 para inputs date (iOS) não estourarem a grelha */}
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
              Fotografias
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-500">
              Desliza as miniaturas (ou a foto no telemóvel) para ver mais. Clica na imagem ou no ícone para ver em grande.
            </p>
            <RoupaFotosGaleria
              tema={tituloExibicao}
              ano={roupa.ano}
              photos={galeriaPhotos}
              imagemUrl={roupa.imagemUrl}
            />
          </section>

          <RoupaDetailAdminSection
            serverIsAdmin={false}
            roupaId={roupa.id}
            initialCoverUrl={roupa.imagemUrl}
            editorRoupa={{
              id: roupa.id,
              ano: roupa.ano,
              tema: roupa.tema,
              descricao: roupa.descricao,
              conjuntoInclui: roupa.conjuntoInclui,
              regrasLavagem: roupa.regrasLavagem,
              precoAluguer: roupa.precoAluguer,
              quantidadeHomem: roupa.quantidadeHomem,
              quantidadeMulher: roupa.quantidadeMulher,
            }}
          />

          <CalendarioDisponibilidade roupaId={roupa.id} />
          <FormularioReserva
            roupa={{
              id: roupa.id,
              ano: roupa.ano,
              tema: tituloExibicao,
              precoAluguer: roupa.precoAluguer,
            }}
          />
        </div>
      </div>
    </div>
  );
}
