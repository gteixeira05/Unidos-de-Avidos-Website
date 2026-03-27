"use client";

import Link from "next/link";
import { useState } from "react";

const ESTADOS = ["LIVRE", "ALUGADA", "MANUTENCAO"] as const;

export default function AdminDisponibilidadePage({ params }: { params: { id: string } }) {
  const roupaId = params.id;
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>("MANUTENCAO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/disponibilidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roupaId, inicio, fim, estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar disponibilidade.");
      setSuccess("Disponibilidade atualizada com sucesso.");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href={`/admin/roupas/${roupaId}`} className="text-sm font-medium text-[#00923f] hover:underline">
        ← Voltar à roupa
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-gray-900">
        Admin · Disponibilidade
      </h1>
      <p className="mt-3 text-gray-600">
        Defina o estado por intervalo de datas (bulk).
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Início
            </label>
            <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base outline-none sm:h-10 sm:text-sm"
                required
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fim
            </label>
            <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base outline-none sm:h-10 sm:text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as (typeof ESTADOS)[number])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
        >
          {loading ? "A atualizar…" : "Atualizar"}
        </button>
      </form>
    </div>
  );
}

