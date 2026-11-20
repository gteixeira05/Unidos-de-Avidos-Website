import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { exigirAdmin, texto } from "@/lib/conteudos-admin";
import { mediaAssetFolderPrefix } from "@/lib/media/asset-folder";
import { obterVideoCloudinary } from "@/lib/media/cloudinary";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  const items = await prisma.roupaVideo.findMany({ where: { roupaId: id }, orderBy: [{ ordem: "asc" }, { createdAt: "asc" }] });
  return Response.json({ items });
}

/** Regista um vídeo já enviado para o Cloudinary (confirma lá que existe e pertence a esta roupa). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const publicId = typeof body?.publicId === "string" ? body.publicId : "";

  if (!publicId.startsWith(`${mediaAssetFolderPrefix()}/roupas/${id}/videos/`)) {
    return Response.json({ error: "Vídeo inválido." }, { status: 400 });
  }
  const roupa = await prisma.roupa.findUnique({ where: { id }, select: { id: true, ano: true } }).catch(() => null);
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });
  const info = await obterVideoCloudinary(publicId);
  if (!info) return Response.json({ error: "O vídeo não foi encontrado no Cloudinary." }, { status: 400 });

  const ordem = await prisma.roupaVideo.count({ where: { roupaId: id } });
  const video = await prisma.roupaVideo.create({
    data: {
      roupaId: id,
      url: info.secureUrl,
      publicId,
      titulo: texto(body?.titulo, 120),
      duracao: info.duracao,
      largura: info.largura,
      altura: info.altura,
      ordem,
    },
  });
  await logAdminAction(s, {
    action: "ROUPA_VIDEO_ADD",
    entityType: "ROUPA",
    entityId: id,
    description: `Acrescentou um vídeo à roupa de ${roupa.ano}.`,
  });
  revalidatePath(`/aluguer-roupas/${id}`);
  return Response.json({ video }, { status: 201 });
}
