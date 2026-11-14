import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { getSessionFromRequest, type SessionUser } from "@/lib/auth";
import { TAG_CONTEUDOS } from "@/lib/conteudos";

/** Sessão de admin ou resposta de erro (401/403). */
export async function exigirAdmin(req: NextRequest): Promise<SessionUser | Response> {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });
  return session;
}

/** Depois de guardar conteúdos: o site mostra logo a versão nova. */
export function revalidarConteudos() {
  revalidateTag(TAG_CONTEUDOS, { expire: 0 });
  revalidatePath("/", "layout");
}

export function texto(v: unknown, max = 5000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

export function diaValido(v: unknown): Date | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
}
