"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">Erro</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Algo correu mal</h1>
      <p className="mt-4 text-lg text-gray-600">
        Ocorreu um erro inesperado. Tente novamente; se o problema continuar, contacte-nos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#00923f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007a33]"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#00923f] hover:text-[#00923f]"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
