/**
 * Disparado no cliente após marcar como lidas ou apagar notificações,
 * para o Header atualizar o contador sem esperar pelo próximo poll.
 * “Tempo real” no browser: este evento + polling periódico a /api/notifications/unread-count.
 * (WebSockets/SSE com broadcast exigem estado partilhado ou serviço tipo Pusher — ver README.)
 */
export const NOTIFICATIONS_MUTATED_EVENT = "unidos-notifications-mutated";

export function notifyNotificationsMutated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_MUTATED_EVENT));
}
