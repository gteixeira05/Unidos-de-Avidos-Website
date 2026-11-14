import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { getContactos } from "@/lib/conteudos";
import type { Contactos } from "@/lib/contactos";
import { exigirAdmin, revalidarConteudos, texto } from "@/lib/conteudos-admin";
import { normalizeEmail } from "@/lib/security";

export async function GET(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  return Response.json({ contactos: await getContactos() });
}

export async function PUT(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const b = await req.json().catch(() => ({}));

  const linhas = (v: unknown, max: number) =>
    Array.isArray(v) ? v.map((x) => texto(x, 120)).filter((x): x is string => !!x).slice(0, max) : [];
  const url = (v: unknown) => {
    const t = texto(v, 300);
    return t && /^https:\/\//.test(t) ? t : "";
  };

  const email = normalizeEmail(b?.email);
  const whatsapp = (texto(b?.whatsapp, 20) ?? "").replace(/\D/g, "");
  const contactos: Contactos = {
    morada: linhas(b?.morada, 4),
    moradaMapa: texto(b?.moradaMapa, 300) ?? "",
    nif: (texto(b?.nif, 20) ?? "").replace(/\D/g, ""),
    email: email ?? "",
    telefones: linhas(b?.telefones, 5),
    whatsapp: whatsapp.length === 9 ? `351${whatsapp}` : whatsapp,
    facebook: url(b?.facebook),
    instagram: url(b?.instagram),
  };
  if (!contactos.email) return Response.json({ error: "Email inválido." }, { status: 400 });
  if (contactos.morada.length === 0) return Response.json({ error: "Indique a morada." }, { status: 400 });

  await prisma.siteConfig.upsert({
    where: { chave: "contactos" },
    create: { chave: "contactos", valor: contactos as unknown as Prisma.InputJsonValue },
    update: { valor: contactos as unknown as Prisma.InputJsonValue },
  });
  await logAdminAction(s, { action: "CONTACTOS_UPDATE", entityType: "CONTACTOS", description: "Atualizou os contactos do site." });
  revalidarConteudos();
  return Response.json({ contactos });
}
