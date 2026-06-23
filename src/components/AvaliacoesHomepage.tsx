"use client";

import { useEffect, useState } from "react";

type AvaliacaoPublica = {
  id: string;
  nota: number;
  comentario?: string | null;
  createdAt: string;
  user: { name: string };
};

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < nota ? "text-amber-400" : "text-gray-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function EstrelaInterativa({
  index,
  nota,
  hover,
  onHover,
  onLeave,
  onClick,
}: {
  index: number;
  nota: number;
  hover: number;
  onHover: (n: number) => void;
  onLeave: () => void;
  onClick: (n: number) => void;
}) {
  const ativa = index <= (hover || nota);
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
      onClick={() => onClick(index)}
      className="focus:outline-none"
      aria-label={`${index} estrela${index !== 1 ? "s" : ""}`}
    >
      <svg
        className={`h-8 w-8 transition-colors ${ativa ? "text-amber-400" : "text-gray-200"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}

const LABELS = ["", "Mau", "Razoável", "Bom", "Muito bom", "Excelente"];

export default function AvaliacoesHomepage() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUtilizador, setNomeUtilizador] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/avaliacoes")
      .then((r) => r.json())
      .then((d) => setAvaliacoes((d.items ?? []) as AvaliacaoPublica[]))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setNomeUtilizador(d.user?.name ?? ""))
      .catch(() => setNomeUtilizador(""));
  }, []);

  function abrirModal() {
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setTimeout(() => {
      setNota(0);
      setHover(0);
      setComentario("");
      setEnviada(false);
      setErro(null);
    }, 200);
  }

  async function submeter() {
    if (nota < 1 || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota, comentario: comentario.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar");
      setEnviada(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return null;
  if (!avaliacoes.length) return null;

  const mediaNotas =
    avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length;

  const loggedIn = nomeUtilizador !== null && nomeUtilizador !== "";

  return (
    <>
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
                O que dizem de nós
              </p>
              <h2 className="mt-3 text-3xl font-bold uppercase leading-tight text-gray-900 sm:text-4xl">
                Avaliações
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <Estrelas nota={Math.round(mediaNotas)} />
                <span className="text-sm font-semibold text-gray-700">
                  {mediaNotas.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  · {avaliacoes.length} avaliação{avaliacoes.length !== 1 ? "ões" : ""}
                </span>
              </div>
            </div>
            <button
              onClick={abrirModal}
              className="rounded-lg border border-[#00923f] px-5 py-2.5 text-sm font-semibold text-[#00923f] transition hover:bg-[#00923f] hover:text-white"
            >
              Deixar avaliação
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {avaliacoes.slice(0, 6).map((a) => (
              <article
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <Estrelas nota={a.nota} />
                {a.comentario ? (
                  <p className="flex-1 text-sm leading-relaxed text-gray-700">
                    &ldquo;{a.comentario}&rdquo;
                  </p>
                ) : null}
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00923f]/10 text-xs font-bold text-[#00923f]">
                    {a.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {a.user.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString("pt-PT", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              onClick={fecharModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {!loggedIn ? (
              /* Não autenticado */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00923f]/10">
                  <svg className="h-7 w-7 text-[#00923f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Deixar avaliação</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Para partilhar a sua experiência precisa de ter uma conta.
                </p>
                <a
                  href="/auth?redirect=/"
                  className="mt-6 inline-block w-full rounded-lg bg-[#00923f] py-3 text-sm font-semibold text-white transition hover:bg-[#007a33]"
                >
                  Entrar / Criar conta
                </a>
              </div>
            ) : enviada ? (
              /* Sucesso */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-[#00923f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Obrigado!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  A sua avaliação foi recebida e será publicada após aprovação.
                </p>
                <button
                  onClick={() => { setEnviada(false); setNota(0); setComentario(""); }}
                  className="mt-4 text-sm text-[#00923f] underline underline-offset-2 hover:text-[#007a33]"
                >
                  Deixar outra avaliação
                </button>
              </div>
            ) : (
              /* Formulário */
              <>
                <h3 className="text-lg font-bold text-gray-900">Deixar avaliação</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Como avalia o nosso serviço de aluguer?
                </p>

                <div className="mt-5">
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <EstrelaInterativa
                        key={i}
                        index={i}
                        nota={nota}
                        hover={hover}
                        onHover={setHover}
                        onLeave={() => setHover(0)}
                        onClick={setNota}
                      />
                    ))}
                  </div>
                  {(hover || nota) > 0 && (
                    <p className="mt-1 text-center text-sm font-medium text-amber-600">
                      {LABELS[hover || nota]}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <textarea
                    rows={3}
                    maxLength={600}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Partilhe a sua experiência (opcional)"
                    className="w-full resize-none rounded-lg border border-gray-200 p-3 text-base text-gray-800 placeholder:text-gray-400 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">
                    {comentario.length}/600
                  </p>
                </div>

                {erro && (
                  <p className="mt-2 text-sm text-red-600">{erro}</p>
                )}

                <button
                  onClick={() => void submeter()}
                  disabled={nota === 0 || enviando}
                  className="mt-4 w-full rounded-lg bg-[#00923f] py-3 text-sm font-semibold text-white transition hover:bg-[#007a33] disabled:opacity-50"
                >
                  {enviando ? "A enviar…" : "Publicar avaliação"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
