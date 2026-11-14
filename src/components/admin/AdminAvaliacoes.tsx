"use client";

import AdminTitulo from "@/components/admin/AdminTitulo";
import { useEffect, useState } from "react";
import { TITULOS } from "@/components/admin/AdminPainel";

type AvaliacaoAdmin = {
  id: string;
  nota: number;
  comentario?: string | null;
  aprovada: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

// --- Utilizadores types ---

export default function AdminAvaliacoes() {
  // Secção extraída do painel: o "separador" é fixo.
  const tab: string = "avaliacoes";
  const [avaliacoesAdmin, setAvaliacoesAdmin] = useState<AvaliacaoAdmin[]>([]);
  const [avaliacoesLoading, setAvaliacoesLoading] = useState(false);
  const [avaliacoesError, setAvaliacoesError] = useState("");
  const [avaliacoesFiltro, setAvaliacoesFiltro] = useState<"" | "true" | "false">("");
  const [avaliacaoSavingId, setAvaliacaoSavingId] = useState<string | null>(null);
  const [avaliacaoDeletingId, setAvaliacaoDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "avaliacoes") return;
    let cancelled = false;
    setAvaliacoesLoading(true);
    setAvaliacoesError("");
    const qs = avaliacoesFiltro ? `?aprovada=${avaliacoesFiltro}` : "";
    fetch(`/api/admin/avaliacoes${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAvaliacoesAdmin((data.items ?? []) as AvaliacaoAdmin[]);
      })
      .catch(() => {
        if (!cancelled) setAvaliacoesError("Erro ao carregar avaliações.");
      })
      .finally(() => {
        if (!cancelled) setAvaliacoesLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab, avaliacoesFiltro]);

  async function aprovarAvaliacao(id: string, aprovada: boolean) {
    setAvaliacaoSavingId(id);
    setAvaliacoesError("");
    try {
      const res = await fetch(`/api/admin/avaliacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprovada }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar avaliação.");
      setAvaliacoesAdmin((prev) =>
        prev.map((a) => (a.id === id ? { ...a, aprovada } : a))
      );
    } catch (e) {
      setAvaliacoesError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setAvaliacaoSavingId(null);
    }
  }

  async function eliminarAvaliacao(id: string) {
    setAvaliacaoDeletingId(id);
    setAvaliacoesError("");
    try {
      const res = await fetch(`/api/admin/avaliacoes/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar avaliação.");
      setAvaliacoesAdmin((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setAvaliacoesError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setAvaliacaoDeletingId(null);
    }
  }

  return (
    <div>
      <AdminTitulo titulo={TITULOS.avaliacoes.titulo} descricao={TITULOS.avaliacoes.descricao} />
      {/* Conteúdo Avaliações */}
      {tab === "avaliacoes" && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600">Gerir avaliações submetidas pelos utilizadores.</p>
            <div className="ml-auto flex gap-2">
              {(["", "false", "true"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAvaliacoesFiltro(v)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    avaliacoesFiltro === v
                      ? "bg-[#00923f] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {v === "" ? "Todas" : v === "false" ? "Por aprovar" : "Aprovadas"}
                </button>
              ))}
            </div>
          </div>

          {avaliacoesError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {avaliacoesError}
            </div>
          ) : null}

          {avaliacoesLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : avaliacoesAdmin.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {avaliacoesAdmin.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    a.aprovada ? "border-gray-200" : "border-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} className={`h-4 w-4 ${s <= a.nota ? "text-amber-400" : "text-gray-200"}`} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.aprovada ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {a.aprovada ? "Aprovada" : "Por aprovar"}
                    </span>
                  </div>
                  {a.comentario ? (
                    <p className="mt-2 text-sm text-gray-700">&ldquo;{a.comentario}&rdquo;</p>
                  ) : (
                    <p className="mt-2 text-xs italic text-gray-400">Sem comentário.</p>
                  )}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">{a.user.name}</span>{" "}
                      <span className="text-gray-400">({a.user.email})</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleString("pt-PT")}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!a.aprovada ? (
                      <button
                        type="button"
                        onClick={() => void aprovarAvaliacao(a.id, true)}
                        disabled={avaliacaoSavingId === a.id}
                        className="rounded-lg bg-[#00923f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                      >
                        {avaliacaoSavingId === a.id ? "A processar…" : "Aprovar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void aprovarAvaliacao(a.id, false)}
                        disabled={avaliacaoSavingId === a.id}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                      >
                        {avaliacaoSavingId === a.id ? "A processar…" : "Retirar aprovação"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Eliminar esta avaliação permanentemente?")) {
                          void eliminarAvaliacao(a.id);
                        }
                      }}
                      disabled={avaliacaoDeletingId === a.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {avaliacaoDeletingId === a.id ? "A eliminar…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
              Não há avaliações{avaliacoesFiltro === "false" ? " por aprovar" : avaliacoesFiltro === "true" ? " aprovadas" : ""}.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
