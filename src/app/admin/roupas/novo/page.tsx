"use client";

import AdminTitulo from "@/components/admin/AdminTitulo";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CamposPrecoRoupa, { formParaPrecos, precosParaForm, type PrecosForm } from "@/components/admin/CamposPrecoRoupa";

export default function AdminNovaRoupaPage() {
  const router = useRouter();
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precos, setPrecos] = useState<PrecosForm>(() => precosParaForm({}));
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
          ...formParaPrecos(precos),
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
    <div className="max-w-2xl">
      <AdminTitulo titulo="Nova roupa" descricao="Criar uma roupa para aluguer. Fotos e disponibilidade gerem-se depois de a criar." />

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

        </div>

        <CamposPrecoRoupa value={precos} onChange={setPrecos} idPrefix="nova-roupa" />

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

