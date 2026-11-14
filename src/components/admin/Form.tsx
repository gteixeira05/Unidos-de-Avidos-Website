import type { ReactNode } from "react";

/** Elementos de formulário partilhados pelas páginas de conteúdos do admin. */

export const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f] sm:text-sm";
export const btnPrimario =
  "rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60";
export const btnSecundario =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60";
export const btnPerigo =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60";
export const cartao = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

export function Campo({ id, label, ajuda, children }: { id: string; label: string; ajuda?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {ajuda && <p className="mt-1 text-xs text-gray-500">{ajuda}</p>}
    </div>
  );
}

export function Mensagem({ erro, ok }: { erro?: string | null; ok?: string | null }) {
  if (erro)
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {erro}
      </p>
    );
  if (ok)
    return (
      <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        {ok}
      </p>
    );
  return null;
}

/** fetch JSON com mensagem de erro da API. */
export async function pedido<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Ocorreu um erro.");
  return data as T;
}
