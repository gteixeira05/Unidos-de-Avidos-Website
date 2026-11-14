"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyAuthSessionChanged } from "@/lib/auth-session-events";

/** RGPD: descarregar os dados e eliminar a conta. Admins não podem eliminar a conta aqui. */
export default function PerfilDadosPessoais({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aEliminar, setAEliminar] = useState(false);

  async function eliminar(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Tem a certeza? A conta será eliminada definitivamente e não pode ser recuperada.")) return;
    setErro(null);
    setAEliminar(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível eliminar a conta.");
        return;
      }
      notifyAuthSessionChanged();
      router.replace("/?conta=eliminada");
    } catch {
      setErro("Não foi possível eliminar a conta. Tente novamente.");
    } finally {
      setAEliminar(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#00923f]">Os meus dados</h2>

      <div>
        <p className="text-sm text-gray-600">
          Descarregue uma cópia de todos os dados que guardamos sobre si (conta, reservas, avaliações e notificações).
        </p>
        <a
          href="/api/auth/me/export"
          download
          className="mt-3 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#00923f] hover:text-[#00923f]"
        >
          Descarregar os meus dados
        </a>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-900">Eliminar conta</h3>
        {isAdmin ? (
          <p className="mt-1 text-sm text-gray-600">
            Contas de administração não podem ser eliminadas aqui. Peça a outro administrador para retirar as
            permissões primeiro.
          </p>
        ) : !aberto ? (
          <>
            <p className="mt-1 text-sm text-gray-600">
              A conta, as avaliações e as notificações são apagadas. As reservas passadas ficam guardadas sem os seus
              dados pessoais, para efeitos de contabilidade.
            </p>
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Eliminar a minha conta
            </button>
          </>
        ) : (
          <form onSubmit={eliminar} className="mt-3 space-y-3">
            <label htmlFor="eliminar-password" className="block text-sm text-gray-700">
              Confirme com a sua password:
            </label>
            <input
              id="eliminar-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
            />
            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={aEliminar || !password}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {aEliminar ? "A eliminar…" : "Eliminar definitivamente"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  setPassword("");
                  setErro(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
