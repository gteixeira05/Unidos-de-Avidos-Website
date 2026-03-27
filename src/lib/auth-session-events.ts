/**
 * Evento disparado após login, logout ou qualquer mudança de sessão no cliente,
 * para o Header (e outros) atualizarem imediatamente sem depender só do primeiro mount.
 */
export const AUTH_SESSION_CHANGED_EVENT = "unidos-auth-session-changed";

export function notifyAuthSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}
