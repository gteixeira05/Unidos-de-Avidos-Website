import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { exigirAdmin, texto } from "@/lib/conteudos-admin";
import { apagarVideoCloudinary } from "@/lib/media/cloudinary";

type Ctx = { params: Promise<{ id: string; videoId: string }> };

/** Mudar o título de um vídeo. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const { id, videoId } = await params;
  const body = await req.json().catch(() => ({}));
  const r = await prisma.roupaVideo.updateMany({ where: { id: videoId, roupaId: id }, data: { titulo: texto(body?.titulo, 120) } });
  if (r.count === 0) return Response.json({ error: "Vídeo não encontrado." }, { status: 404 });
  revalidatePath(`/aluguer-roupas/${id}`);
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const { id, videoId } = await params;
  const video = await prisma.roupaVideo.findFirst({ where: { id: videoId, roupaId: id } });
  if (!video) return Response.json({ error: "Vídeo não encontrado." }, { status: 404 });
  await prisma.roupaVideo.delete({ where: { id: video.id } });
  await apagarVideoCloudinary(video.publicId);
  await logAdminAction(s, { action: "ROUPA_VIDEO_DELETE", entityType: "ROUPA", entityId: id, description: "Apagou um vídeo da roupa." });
  revalidatePath(`/aluguer-roupas/${id}`);
  return Response.json({ success: true });
}
