import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/conteudos-admin";
import { mediaAssetFolderPrefix } from "@/lib/media/asset-folder";
import { assinarUploadVideo } from "@/lib/media/cloudinary";
import { TRANSFORMACAO_VIDEO } from "@/lib/media/video-urls";

/** Autoriza o browser a enviar UM vídeo diretamente para o Cloudinary (a Vercel não aceita ficheiros grandes). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!(await prisma.roupa.findUnique({ where: { id }, select: { id: true } }).catch(() => null))) {
    return Response.json({ error: "Roupa não encontrada." }, { status: 404 });
  }
  // Gera logo a versão otimizada (a mesma que o site pede), para o 1.º visitante não esperar.
  const assinatura = assinarUploadVideo(`${mediaAssetFolderPrefix()}/roupas/${id}/videos`, `${TRANSFORMACAO_VIDEO}/mp4`);
  if (!assinatura) {
    return Response.json({ error: "O Cloudinary não está configurado: os vídeos precisam dele." }, { status: 503 });
  }
  return Response.json(assinatura);
}
