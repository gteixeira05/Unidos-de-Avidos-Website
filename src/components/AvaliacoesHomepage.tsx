"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function AvaliacoesHomepage() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPublica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/avaliacoes")
      .then((r) => r.json())
      .then((d) => setAvaliacoes((d.items ?? []) as AvaliacaoPublica[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!avaliacoes.length) return null;

  const mediaNotas =
    avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length;

  return (
    <section className="border-t border-gray-100 bg-gray-50 py-16">
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
          <Link
            href="/auth?redirect=/perfil%23sec-avaliacoes"
            className="rounded-lg border border-[#00923f] px-5 py-2.5 text-sm font-semibold text-[#00923f] transition hover:bg-[#00923f] hover:text-white"
          >
            Deixar avaliação
          </Link>
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
  );
}
