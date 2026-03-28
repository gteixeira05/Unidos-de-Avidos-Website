"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notifyAuthSessionChanged } from "@/lib/auth-session-events";
import { notifyNotificationsMutated } from "@/lib/notification-events";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailNotifContacto?: boolean;
  emailNotifReservas?: boolean;
  emailComunicacoesConsent?: boolean;
  emailComunicacoesConsentAt?: string | null;
  emailComunicacoesRevokedAt?: string | null;
}

type Notificacao = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type ReservaItem = {
  id: string;
  estado: string;
  dataInicio: string;
  dataFim: string;
  createdAt: string;
  roupa: { id: string; ano: number; tema: string; precoAluguer: number };
};

const NOTIF_POLL_MS = 15_000;

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [cancelarReservaId, setCancelarReservaId] = useState<string | null>(null);
  const [cancelarErro, setCancelarErro] = useState("");
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [emailPrefsErro, setEmailPrefsErro] = useState("");
  const [savingMarketingPrefs, setSavingMarketingPrefs] = useState(false);
  const [marketingPrefsErro, setMarketingPrefsErro] = useState("");
  const [apagarPendente, setApagarPendente] = useState<Notificacao | null>(null);

  const loadNotificacoes = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store", credentials: "include" });
      const d = await r.json();
      if (r.ok) setNotificacoes((d?.items ?? []) as Notificacao[]);
    } catch {
      /* ignore */
    }
  }, []);

  const loadReservas = useCallback(async () => {
    try {
      const r = await fetch("/api/reservas/me", { cache: "no-store", credentials: "include" });
      const d = await r.json();
      if (r.ok) setReservas((d?.items ?? []) as ReservaItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d?.user) {
          router.replace("/auth");
          return;
        }
        setUser(d.user as User);
      })
      .catch(() => {
        if (!cancelled) router.replace("/auth");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/notifications", { cache: "no-store", credentials: "include" }).then((r) =>
        r.json()
      ),
      fetch("/api/reservas/me", { cache: "no-store", credentials: "include" }).then((r) =>
        r.json()
      ),
    ])
      .then(([n, r]) => {
        if (cancelled) return;
        setNotificacoes((n?.items ?? []) as Notificacao[]);
        setReservas((r?.items ?? []) as ReservaItem[]);
        notifyNotificationsMutated();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#sec-notificacoes") return;
    const t = window.setTimeout(() => {
      document.getElementById("sec-notificacoes")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(t);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => void loadNotificacoes(), NOTIF_POLL_MS);
    return () => window.clearInterval(id);
  }, [user, loadNotificacoes]);

  async function cancelarReserva(id: string) {
    setCancelarErro("");
    setCancelarReservaId(id);
    try {
      const r = await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cancelar" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Não foi possível cancelar a reserva.");
      await loadReservas();
    } catch (e) {
      setCancelarErro(e instanceof Error ? e.message : "Não foi possível cancelar a reserva.");
    } finally {
      setCancelarReservaId(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadNotificacoes();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, loadNotificacoes]);

  async function markAsRead(ids: string[]) {
    if (!ids.length) return;
    const now = new Date().toISOString();
    setNotificacoes((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n))
    );
    try {
      const r = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      if (!r.ok) void loadNotificacoes();
    } catch {
      void loadNotificacoes();
    }
    notifyNotificationsMutated();
  }

  async function apagarNotificacoes(ids: string[]) {
    if (!ids.length) return;
    setNotificacoes((prev) => prev.filter((n) => !ids.includes(n.id)));
    try {
      const r = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      if (!r.ok) void loadNotificacoes();
    } catch {
      void loadNotificacoes();
    }
    notifyNotificationsMutated();
  }

  async function updateAdminEmailPrefs(next: {
    emailNotifContacto: boolean;
    emailNotifReservas: boolean;
  }) {
    setEmailPrefsErro("");
    setSavingEmailPrefs(true);
    setUser((prev) => (prev ? { ...prev, ...next } : prev));
    try {
      const r = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Não foi possível guardar preferências.");
      if (d?.user) setUser(d.user as User);
    } catch (e) {
      setEmailPrefsErro(e instanceof Error ? e.message : "Não foi possível guardar preferências.");
      fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        .then((resp) => resp.json())
        .then((d) => {
          if (d?.user) setUser(d.user as User);
        })
        .catch(() => {});
    } finally {
      setSavingEmailPrefs(false);
    }
  }

  async function updateMarketingConsent(next: boolean) {
    setMarketingPrefsErro("");
    setSavingMarketingPrefs(true);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            emailComunicacoesConsent: next,
            emailComunicacoesConsentAt: next
              ? new Date().toISOString()
              : prev.emailComunicacoesConsentAt ?? null,
            emailComunicacoesRevokedAt: next ? null : new Date().toISOString(),
          }
        : prev
    );
    try {
      const r = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailComunicacoesConsent: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Não foi possível guardar preferência de comunicações.");
      if (d?.user) setUser(d.user as User);
    } catch (e) {
      setMarketingPrefsErro(
        e instanceof Error ? e.message : "Não foi possível guardar preferência de comunicações."
      );
      fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        .then((resp) => resp.json())
        .then((d) => {
          if (d?.user) setUser(d.user as User);
        })
        .catch(() => {});
    } finally {
      setSavingMarketingPrefs(false);
    }
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        notifyAuthSessionChanged();
        notifyNotificationsMutated();
        router.replace("/auth");
      });
  };

  const naoLidas = notificacoes.filter((n) => !n.readAt);
  const lidas = notificacoes.filter((n) => n.readAt);
  const estadoReservaLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    REJEITADA: "Rejeitada",
    CANCELADA: "Cancelada",
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <p className="text-gray-600">A carregar o seu perfil…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900">O meu perfil</h1>
      <p className="text-gray-600">
        Bem-vindo, {user.name}. Aqui pode consultar as suas reservas e notificações.
      </p>

      <div
        id="sec-reservas"
        className="scroll-mt-28 space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-[#00923f]">Dados da conta</h2>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Nome:</span> {user.name}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Tipo de perfil:</span>{" "}
            {user.role === "SUPER_ADMIN" ? "Super Admin" : "Administrador"}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Terminar sessão
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#00923f]">Comunicações da associação</h2>
        <p className="text-sm text-gray-600">
          Pode autorizar ou revogar o envio de emails sobre eventos, atividades e comunicações
          institucionais.
        </p>
        {marketingPrefsErro ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {marketingPrefsErro}
          </p>
        ) : null}
        <label className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
          <span className="text-sm text-gray-800">
            Autorizo receção de comunicações informativas por email.
          </span>
          <input
            type="checkbox"
            checked={Boolean(user.emailComunicacoesConsent)}
            disabled={savingMarketingPrefs}
            onChange={(e) => void updateMarketingConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#00923f]"
          />
        </label>
        {user.emailComunicacoesConsentAt ? (
          <p className="text-xs text-gray-500">
            Consentimento ativo desde{" "}
            {new Date(user.emailComunicacoesConsentAt).toLocaleString("pt-PT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        ) : user.emailComunicacoesRevokedAt ? (
          <p className="text-xs text-gray-500">
            Consentimento revogado em{" "}
            {new Date(user.emailComunicacoesRevokedAt).toLocaleString("pt-PT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Sem consentimento ativo para comunicações informativas.
          </p>
        )}
      </div>

      {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#00923f]">Emails de administração</h2>
          <p className="text-sm text-gray-600">
            Estas opções controlam apenas os emails. No site, as notificações continuam sempre ativas.
          </p>
          {emailPrefsErro ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {emailPrefsErro}
            </p>
          ) : null}
          <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <span className="text-sm text-gray-800">Receber emails de novos contactos (formulário)</span>
            <input
              type="checkbox"
              checked={Boolean(user.emailNotifContacto)}
              disabled={savingEmailPrefs}
              onChange={(e) =>
                void updateAdminEmailPrefs({
                  emailNotifContacto: e.target.checked,
                  emailNotifReservas: Boolean(user.emailNotifReservas),
                })
              }
              className="h-4 w-4 accent-[#00923f]"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <span className="text-sm text-gray-800">Receber emails de novas reservas</span>
            <input
              type="checkbox"
              checked={Boolean(user.emailNotifReservas)}
              disabled={savingEmailPrefs}
              onChange={(e) =>
                void updateAdminEmailPrefs({
                  emailNotifContacto: Boolean(user.emailNotifContacto),
                  emailNotifReservas: e.target.checked,
                })
              }
              className="h-4 w-4 accent-[#00923f]"
            />
          </label>
        </div>
      ) : null}

      <div
        id="sec-notificacoes"
        className="scroll-mt-28 space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#00923f]">Notificações</h2>
          {notificacoes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {naoLidas.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAsRead(naoLidas.map((n) => n.id))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                >
                  Marcar todas como lidas
                </button>
              ) : null}
              {lidas.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Apagar todas as notificações já lidas?")) {
                      void apagarNotificacoes(lidas.map((n) => n.id));
                    }
                  }}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Apagar lidas
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {notificacoes.length ? (
          <ul className="space-y-3">
            {notificacoes.map((n) => {
              const unread = !n.readAt;
              return (
                <li
                  key={n.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    unread
                      ? "border-[#00923f]/50 bg-[#00923f]/10 shadow-[inset_4px_0_0_#00923f]"
                      : "border-gray-200 bg-gray-50/80 opacity-95"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm ${unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                        >
                          {n.title}
                        </p>
                        {unread ? (
                          <span className="shrink-0 rounded-full bg-[#00923f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Nova
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Lida
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(n.createdAt).toLocaleString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {n.body ? <p className="mt-2 text-sm text-gray-700">{n.body}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.readAt) setApagarPendente(n);
                        else void apagarNotificacoes([n.id]);
                      }}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      title="Apagar notificação"
                    >
                      Apagar
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => void markAsRead([n.id])}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Marcar como lida
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Sem notificações por agora.</p>
        )}
        <p className="text-xs text-gray-500">
          A lista atualiza automaticamente (~15 s) enquanto esta página está aberta. O número no ícone do
          perfil (canto superior direito no telemóvel) também é atualizado.
        </p>
      </div>

      {apagarPendente ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apagar-notif-titulo"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar"
            onClick={() => setApagarPendente(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h2 id="apagar-notif-titulo" className="text-lg font-bold text-gray-900">
              Apagar notificação?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Esta notificação ainda não foi lida. Quer apagá-la na mesma? Esta ação não pode ser anulada.
            </p>
            <p className="mt-3 rounded-lg bg-[#00923f]/5 p-2 text-sm font-medium text-gray-800">
              {apagarPendente.title}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setApagarPendente(null)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = apagarPendente.id;
                  setApagarPendente(null);
                  void apagarNotificacoes([id]);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#00923f]">As minhas reservas</h2>
        {cancelarErro ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {cancelarErro}
          </p>
        ) : null}
        {reservas.length ? (
          <ul className="space-y-3">
            {reservas.slice(0, 10).map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-medium text-gray-900">
                  {r.roupa.tema} ({r.roupa.ano})
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Estado:{" "}
                  <span className="font-medium">{estadoReservaLabel[r.estado] ?? r.estado}</span>
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {new Date(r.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                  {new Date(r.dataFim).toLocaleDateString("pt-PT")}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Valor:{" "}
                  <span className="font-medium">Ainda não definido (a acordar)</span>
                </p>
                {["PENDENTE", "APROVADA"].includes(r.estado) ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm("Tem a certeza que quer cancelar esta reserva? Esta ação não pode ser anulada.")
                        ) {
                          void cancelarReserva(r.id);
                        }
                      }}
                      disabled={cancelarReservaId === r.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {cancelarReservaId === r.id ? "A cancelar…" : "Cancelar reserva"}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Ainda não tem reservas.</p>
        )}
      </div>
    </div>
  );
}
