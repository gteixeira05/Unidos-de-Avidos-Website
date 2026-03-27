"use client";

import { useEffect, useState } from "react";

/**
 * Alinha a UI de “modo admin” em páginas públicas com o que o servidor confirma em /api/auth/me.
 * Em mobile (Safari) o HTML/RSC pode chegar sem refletir o cookie; após o fetch ficamos corretos.
 */
export function useResolvedAdmin(serverIsAdmin: boolean): boolean {
  const [resolved, setResolved] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user?: { role?: string } | null }) => {
        if (cancelled) return;
        const role = d?.user?.role;
        setResolved(role === "ADMIN" || role === "SUPER_ADMIN");
      })
      .catch(() => {
        if (!cancelled) setResolved(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return resolved === null ? serverIsAdmin : resolved;
}
