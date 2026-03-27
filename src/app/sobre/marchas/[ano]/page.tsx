import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MARCHAS_INFO } from "@/lib/marchasAntoninas";
import { Play } from "lucide-react";

export default async function MarchaAnoPage({
  params,
}: {
  params: Promise<{ ano: string }>;
}) {
  const { ano: anoParam } = await params;
  const ano = Number(anoParam);

  if (Number.isNaN(ano)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/sobre/marchas"
          className="mb-6 inline-block text-sm font-medium text-[#00923f] hover:underline"
        >
          ← Voltar às Marchas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Marchas Antoninas</h1>
        <p className="mt-4 text-lg text-gray-600">
          Ano inválido. Por favor volte à lista de anos.
        </p>
      </div>
    );
  }

  const roupa = await prisma.roupa.findFirst({
    where: { ano },
    orderBy: { createdAt: "desc" },
  });

  const info = MARCHAS_INFO[ano];
  const actuacaoUrl = info?.youtubeUrl;
  // Só usar tema de MARCHAS_INFO (fonte oficial); não usar roupa.tema para não mostrar temas aleatórios
  const temaResolvido = info?.tema?.trim() || null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/sobre/marchas"
        className="mb-6 inline-block text-sm font-medium text-[#00923f] hover:underline"
      >
        ← Voltar às Marchas
      </Link>

      <h1 className="text-3xl font-bold text-gray-900">
        Marchas Antoninas — {ano}
      </h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#00923f]">
            Tema e descrição
          </h2>
          {temaResolvido ? (
            <>
              <p className="mt-4 text-lg font-medium text-gray-900">
                Tema: {temaResolvido}
              </p>
              {roupa?.descricao?.trim() ? (
                <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
                  {roupa.descricao}
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  Em breve será adicionada uma descrição detalhada desta
                  participação.
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Ainda não há informação sobre o tema e a participação neste ano.
              Em breve serão adicionadas mais informações.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#00923f]">Classificação</h2>
          {info?.subtitulo && (
            <p className="mt-2 text-sm text-gray-600">{info.subtitulo}</p>
          )}

          {info?.classificacao?.length ? (
            <ol className="mt-4 space-y-3">
              {info.classificacao.map((c, idx) => (
                <li key={`${c.pos}-${idx}`} className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {c.pos} {c.nome}
                  </p>
                  {(c.pontos || c.premios) && (
                    <p className="mt-1 text-sm text-gray-700">
                      {c.pontos ? <span>{c.pontos}</span> : null}
                      {c.pontos && c.premios ? <span> — </span> : null}
                      {c.premios ? <span className="font-medium">{c.premios}</span> : null}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Ainda não há informação disponível para este ano.
            </p>
          )}

          {info?.mensagem && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Mensagem
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                {info.mensagem}
              </p>
            </div>
          )}

          {info?.outros?.length ? (
            <div className="mt-6 space-y-5">
              {info.outros.map((b, idx) => (
                <div key={`${b.titulo}-${idx}`}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {b.titulo}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                    {b.texto}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Ver fotos deste ano
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Aceda à galeria de fotografias das Marchas Antoninas de {ano}.
            </p>
            <Link
              href={`/galeria/${ano}`}
              className="mt-4 inline-block text-sm font-medium text-[#00923f] hover:underline"
            >
              Abrir galeria →
            </Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Vídeo da atuação
            </h2>
            {actuacaoUrl ? (
              <>
                <p className="mt-2 text-sm text-gray-600">
                  Veja a atuação completa das Marchas Antoninas de {ano}.
                </p>
                <Link
                  href={actuacaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff0000] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e60000]"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  Ver no YouTube
                </Link>
              </>
            ) : (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                Não há vídeo disponível para este ano.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

