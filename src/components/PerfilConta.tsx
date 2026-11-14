"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]";
const btnPrimary =
  "rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60";
const btnSecondary = "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";

type Props = {
  user: { name: string; email: string; phone?: string | null };
  onUpdated: (u: { name: string; phone: string | null }) => void;
};

/** Dados da conta: ver/editar nome e telefone, e mudar a password. */
export default function PerfilConta({ user, onUpdated }: Props) {
  const [modo, setModo] = useState<"ver" | "editar" | "password">("ver");
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  function abrir(m: "ver" | "editar" | "password") {
    setModo(m);
    setErro(null);
    setOk(null);
    setName(user.name);
    setPhone(user.phone ?? "");
    setAtual("");
    setNova("");
    setConfirmar("");
  }

  async function enviar(url: string, method: string, body: unknown) {
    setErro(null);
    setAGuardar(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível guardar.");
        return null;
      }
      return data;
    } catch {
      setErro("Não foi possível guardar. Tente novamente.");
      return null;
    } finally {
      setAGuardar(false);
    }
  }

  async function guardarDados(e: React.FormEvent) {
    e.preventDefault();
    const data = await enviar("/api/auth/me/perfil", "PATCH", { name, phone });
    if (data?.user) {
      onUpdated(data.user);
      setModo("ver");
      setOk("Dados atualizados.");
    }
  }

  async function mudarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (nova !== confirmar) {
      setErro("As passwords novas não coincidem.");
      return;
    }
    const data = await enviar("/api/auth/me/password", "POST", { currentPassword: atual, newPassword: nova });
    if (data) {
      setModo("ver");
      setOk("Password alterada. As sessões noutros dispositivos foram terminadas.");
    }
  }

  return (
    <div className="space-y-3">
      {modo === "ver" && (
        <>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Nome:</span> {user.name}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Telefone:</span> {user.phone || <span className="text-gray-400">—</span>}
          </p>
          {ok && (
            <p role="status" className="text-sm text-[#007a33]">
              {ok}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => abrir("editar")} className={btnSecondary}>
              Editar dados
            </button>
            <button type="button" onClick={() => abrir("password")} className={btnSecondary}>
              Mudar password
            </button>
          </div>
        </>
      )}

      {modo === "editar" && (
        <form onSubmit={guardarDados} className="space-y-3">
          <div>
            <label htmlFor="perfil-nome" className="mb-1 block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input id="perfil-nome" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="perfil-telefone" className="mb-1 block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              id="perfil-telefone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <p className="text-xs text-gray-500">O email não pode ser alterado. Se precisar, fale connosco.</p>
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={aGuardar} className={btnPrimary}>
              {aGuardar ? "A guardar…" : "Guardar"}
            </button>
            <button type="button" onClick={() => abrir("ver")} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {modo === "password" && (
        <form onSubmit={mudarPassword} className="space-y-3">
          {[
            { id: "pw-atual", label: "Password atual", value: atual, set: setAtual, auto: "current-password" },
            { id: "pw-nova", label: "Nova password", value: nova, set: setNova, auto: "new-password" },
            { id: "pw-confirmar", label: "Confirmar nova password", value: confirmar, set: setConfirmar, auto: "new-password" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="mb-1 block text-sm font-medium text-gray-700">
                {f.label}
              </label>
              <input
                id={f.id}
                type="password"
                required
                autoComplete={f.auto}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">
            Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo. As sessões noutros dispositivos serão
            terminadas.
          </p>
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={aGuardar} className={btnPrimary}>
              {aGuardar ? "A guardar…" : "Mudar password"}
            </button>
            <button type="button" onClick={() => abrir("ver")} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
