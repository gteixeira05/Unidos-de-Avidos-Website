"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  roupaId: string;
  className?: string;
  onDeleted?: () => void;
};

export default function AdminRoupasControls({ roupaId, className, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function removeConfirmed() {
    setConfirmBusy(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/roupas/${roupaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar.");
      setDeleteOpen(false);
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
      setConfirmBusy(false);
    }
  }

  return (
    <div className={className}>
      {error ? (
        <p className="mb-2 text-xs text-red-700">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/aluguer-roupas/${roupaId}`}
          className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {loading ? "A eliminar…" : "Eliminar"}
        </button>
      </div>

      {deleteOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-red-50/80 p-5">
              <h2 className="text-lg font-bold text-gray-900">Eliminar roupa?</h2>
              <p className="mt-1 text-sm text-gray-700">
                Esta ação é permanente e elimina a roupa do sistema.
              </p>
            </div>
            <div className="p-5">
              {error ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={confirmBusy}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void removeConfirmed()}
                  disabled={confirmBusy}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {confirmBusy ? "A eliminar…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

