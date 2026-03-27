"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GaleriaRemovePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  function openConfirm() {
    setError("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (!busy) setConfirmOpen(false);
  }

  async function confirmRemove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/galeria/fotos?id=${encodeURIComponent(photoId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao remover.");
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover a foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 bg-red-50/95 px-3 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:bg-red-100 disabled:opacity-60 sm:w-auto sm:rounded-lg sm:border sm:border-red-200 sm:bg-white sm:py-2 sm:shadow-sm sm:hover:bg-red-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0 opacity-80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Remover foto
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-photo-title"
        >
          <button
            type="button"
            onClick={closeConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-red-50/80 p-5">
              <p className="text-sm font-semibold text-red-700">Confirmar ação</p>
              <h2 id="remove-photo-title" className="mt-1 text-lg font-bold text-gray-900">
                Remover esta fotografia?
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                A imagem será apagada permanentemente da galeria. Esta ação não pode ser
                desfeita.
              </p>
            </div>
            <div className="p-5">
              {error ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmRemove()}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? "A remover…" : "Remover"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
