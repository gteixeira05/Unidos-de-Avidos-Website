"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNovaRoupaPage() {
  const router = useRouter();
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidadeHomem, setQuantidadeHomem] = useState("0");
  const [quantidadeMulher, setQuantidadeMulher] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roupas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          tema,
          descricao,
          precoAluguer: preco,
          quantidadeHomem,
          quantidadeMulher,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar roupa.");
      router.push(`/admin/roupas/${data.roupa.id}`);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin · Nova roupa</h1>
      <p className="mt-4 text-gray-600">Criar uma nova roupa para aluguer.</p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ano</label>
            <input
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Preço (€)</label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fardas homem</label>
            <input
              type="number"
              min={0}
              value={quantidadeHomem}
              onChange={(e) => setQuantidadeHomem(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fardas mulher</label>
            <input
              type="number"
              min={0}
              value={quantidadeMulher}
              onChange={(e) => setQuantidadeMulher(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tema</label>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
        >
          {loading ? "A criar…" : "Criar"}
        </button>
      </form>
    </div>
  );
}

