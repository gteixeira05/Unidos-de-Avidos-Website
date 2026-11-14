import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/** O utilizador atualiza o nome e o telefone. O email não muda aqui (é a identidade da conta). */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name || name.length > 120) {
    return Response.json({ error: "Indique um nome válido (até 120 caracteres)." }, { status: 400 });
  }
  if (phone && !/^\+?[0-9 ()-]{6,20}$/.test(phone)) {
    return Response.json({ error: "Telefone inválido." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { name, phone: phone || null },
    select: { name: true, phone: true },
  });
  return Response.json({ success: true, user });
}
