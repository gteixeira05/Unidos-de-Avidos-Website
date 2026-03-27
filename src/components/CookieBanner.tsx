"use client";

import Link from "next/link";
import { useState } from "react";

const STORAGE_KEY = "ua_cookie_consent_v1";

export default function CookieBanner() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      return !accepted;
    } catch {
      return true;
    }
  });

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-5"
      role="dialog"
      aria-label="Informação sobre cookies"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="text-sm leading-relaxed text-gray-700">
          Este site utiliza cookies e tecnologias necessários ao funcionamento seguro (por exemplo,
          sessão de utilizador). Em algumas páginas podem existir conteúdos incorporados de terceiros
          (como mapas). Para mais detalhes, consulte a nossa{" "}
          <Link
            href="/politica-cookies"
            className="font-medium text-[#00923f] underline decoration-[#00923f]/40 underline-offset-2 hover:decoration-[#00923f]"
          >
            política de cookies
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="font-medium text-[#00923f] underline decoration-[#00923f]/40 underline-offset-2 hover:decoration-[#00923f]"
          >
            política de privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-[#00923f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007a33]"
          >
            Compreendo e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
