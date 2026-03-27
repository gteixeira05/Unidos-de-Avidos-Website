"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Define esta foto como capa do álbum (API PATCH JSON). */
export default function GaleriaSetCoverButton({
  ano,
  imageUrl,
  onDone,
}: {
  ano: string;
  imageUrl: string;
  /** Chamado após sucesso (ex.: atualizar estado numa página só client). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setCover() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/galeria/anos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: Number(ano), coverImageUrl: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao definir capa.");
      router.refresh();
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar a capa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <button
        type="button"
        onClick={() => void setCover()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 bg-[#00923f]/10 px-3 py-3 text-sm font-semibold text-[#00923f] transition hover:bg-[#00923f]/15 active:bg-[#00923f]/20 disabled:opacity-60 sm:w-auto sm:rounded-lg sm:border sm:border-[#00923f]/25 sm:bg-white sm:py-2 sm:shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0 opacity-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {busy ? "A atualizar…" : "Usar como capa"}
      </button>
      {error ? <p className="text-center text-xs text-red-600 sm:text-left">{error}</p> : null}
    </div>
  );
}
