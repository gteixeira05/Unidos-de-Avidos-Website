"use client";

import AdminTitulo from "@/components/admin/AdminTitulo";
import { useEffect, useMemo, useState } from "react";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { TITULOS } from "@/components/admin/AdminPainel";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

function userRoleLabel(u: UserItem): string {
  return isSuperAdminEmail(u.email) ? "SUPER_ADMIN" : u.role;
}

function userRoleBadgeClass(u: UserItem): string {
  if (isSuperAdminEmail(u.email)) return "bg-amber-100 text-amber-900";
  return u.role === "ADMIN"
    ? "bg-[#00923f]/10 text-[#00923f]"
    : "bg-gray-100 text-gray-700";
}

type ConfirmState =
  | { open: false }
  | { open: true; user: UserItem; targetRole: "USER" | "ADMIN" };
type DeleteUserConfirmState = | { open: false } | { open: true; user: UserItem };

export default function AdminUtilizadores() {
  // Secção extraída do painel: o "separador" é fixo.
  const tab: string = "utilizadores";
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false });
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<DeleteUserConfirmState>({ open: false });
  const [deleteUserConfirmText, setDeleteUserConfirmText] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);


  const query = useMemo(() => q.trim(), [q]);


  useEffect(() => {
    if (tab !== "utilizadores") return;
    let cancelled = false;
    setUsersLoading(true);
    setUsersError("");
    fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUsers((data.items ?? []) as UserItem[]);
      })
      .catch(() => {
        if (!cancelled) setUsersError("Erro ao carregar utilizadores.");
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, query]);

  async function setRole(id: string, role: "USER" | "ADMIN") {
    setUsersError("");
    setRoleSavingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar role.");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: data.user.role } : u))
      );
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setRoleSavingId(null);
    }
  }

  function openConfirm(user: UserItem, targetRole: "USER" | "ADMIN") {
    setConfirmState({ open: true, user, targetRole });
  }
  function closeConfirm() {
    setConfirmState({ open: false });
  }

  function openDeleteUserConfirm(user: UserItem) {
    setDeleteUserConfirmText("");
    setDeleteUserState({ open: true, user });
  }

  function closeDeleteUserConfirm() {
    if (deletingUserId) return;
    setDeleteUserConfirmText("");
    setDeleteUserState({ open: false });
  }

  async function reloadUsers() {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar utilizadores.");
      setUsers((data.items ?? []) as UserItem[]);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function deleteUserPermanente(id: string) {
    setUsersError("");
    setDeletingUserId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar utilizador.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteUserState({ open: false });
      setDeleteUserConfirmText("");
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div>
      <AdminTitulo titulo={TITULOS.utilizadores.titulo} descricao={TITULOS.utilizadores.descricao} />
      {/* Conteúdo Utilizadores */}
      {tab === "utilizadores" && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por nome ou email…"
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
            />
            <button
              type="button"
              onClick={reloadUsers}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Recarregar
            </button>
          </div>

          {usersError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {usersError}
            </div>
          ) : null}

          {usersLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : (
            <>
              <div className="mt-6 grid gap-3 md:hidden">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {u.name}
                        </p>
                        <p className="truncate text-sm text-gray-600">{u.email}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${userRoleBadgeClass(u)}`}
                      >
                        {userRoleLabel(u)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {isSuperAdminEmail(u.email) ? (
                        <span className="w-full rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-600">
                          Super Admin (email)
                        </span>
                      ) : u.role === "ADMIN" ? (
                        <button
                          type="button"
                          onClick={() => openConfirm(u, "USER")}
                          disabled={roleSavingId === u.id}
                          className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        >
                          {roleSavingId === u.id ? "A atualizar…" : "Remover admin"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openConfirm(u, "ADMIN")}
                          disabled={roleSavingId === u.id}
                          className="w-full rounded-lg bg-[#00923f] px-3 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                        >
                          {roleSavingId === u.id ? "A atualizar…" : "Promover a admin"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDeleteUserConfirm(u)}
                        disabled={
                          roleSavingId === u.id ||
                          deletingUserId === u.id ||
                          isSuperAdminEmail(u.email)
                        }
                        className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingUserId === u.id ? "A eliminar…" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                ))}
                {!users.length ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
                    Sem utilizadores encontrados.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${userRoleBadgeClass(u)}`}
                          >
                            {userRoleLabel(u)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {isSuperAdminEmail(u.email) ? (
                              <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                —
                              </span>
                            ) : u.role === "ADMIN" ? (
                              <button
                                type="button"
                                onClick={() => openConfirm(u, "USER")}
                                disabled={roleSavingId === u.id}
                                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                              >
                                {roleSavingId === u.id ? "A atualizar…" : "Despromover"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openConfirm(u, "ADMIN")}
                                disabled={roleSavingId === u.id}
                                className="rounded-lg bg-[#00923f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                              >
                                {roleSavingId === u.id ? "A atualizar…" : "Promover"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDeleteUserConfirm(u)}
                              disabled={
                                roleSavingId === u.id ||
                                deletingUserId === u.id ||
                                isSuperAdminEmail(u.email)
                              }
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              {deletingUserId === u.id ? "A eliminar…" : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!users.length ? (
                      <tr>
                        <td className="px-4 py-6 text-gray-600" colSpan={4}>
                          Sem utilizadores encontrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de confirmação (utilizadores) */}
      {confirmState.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <p className="text-sm font-semibold text-[#00923f]">Confirmar ação</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {confirmState.targetRole === "ADMIN"
                  ? "Promover a administrador?"
                  : "Remover permissões de administrador?"}
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-semibold">{confirmState.user.name}</span>{" "}
                <span className="text-gray-500">({confirmState.user.email})</span>
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">
                {confirmState.targetRole === "ADMIN"
                  ? "Este utilizador passará a ter acesso às ferramentas de administração."
                  : "Este utilizador deixará de ter acesso às ferramentas de administração."}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { user, targetRole } = confirmState;
                    closeConfirm();
                    await setRole(user.id, targetRole);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    confirmState.targetRole === "ADMIN"
                      ? "bg-[#00923f] hover:bg-[#007a33]"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação (eliminação de utilizador) */}
      {deleteUserState.open && (
        <div
          className="fixed inset-0 z-[62] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeDeleteUserConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Ação crítica</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Eliminar utilizador permanentemente?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Esta ação remove a conta de forma definitiva.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deleteUserState.user.name}</span>{" "}
                <span className="text-gray-500">({deleteUserState.user.email})</span>
              </p>
              <p className="text-xs text-gray-600">
                Para confirmar, escreva <span className="font-bold">ELIMINAR</span> no campo abaixo.
              </p>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={deleteUserConfirmText}
                onChange={(e) => setDeleteUserConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="ua-ios-confirm-input w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDeleteUserConfirm}
                  disabled={deletingUserId === deleteUserState.user.id}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void deleteUserPermanente(deleteUserState.user.id)}
                  disabled={
                    deletingUserId === deleteUserState.user.id ||
                    deleteUserConfirmText.trim().toUpperCase() !== "ELIMINAR"
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingUserId === deleteUserState.user.id ? "A eliminar…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
