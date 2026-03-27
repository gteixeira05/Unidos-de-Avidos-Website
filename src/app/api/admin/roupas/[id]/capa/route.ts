import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  isDedicatedRoupaCoverFilename,
  isRoupaImageUrlForRoupa,
} from "@/lib/roupa-images";
import { persistRoupaCoverFile } from "@/lib/roupa-photo-upload";
import { unlinkPublicRoupaFile } from "@/lib/roupa-files";
import { logAdminAction } from "@/lib/admin-audit";

/** Atualiza `imagemUrl` (capa do catálogo): upload de ficheiro ou escolher foto existente da galeria desta roupa. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id: roupaId } = await params;
  const roupa = await prisma.roupa.findUnique({
    where: { id: roupaId },
    select: { id: true, imagemUrl: true, ano: true, tema: true },
  });
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const cover = formData.get("cover") as File | null;
    if (!cover || cover.size === 0) {
      return Response.json({ error: "Selecione uma imagem para a capa." }, { status: 400 });
    }
    // Em Vercel, uploads multipart muito grandes podem ser recusados pela plataforma.
    const MAX_VERCEL_UPLOAD_BYTES = 4 * 1024 * 1024;
    if (process.env.VERCEL && cover.size > MAX_VERCEL_UPLOAD_BYTES) {
      return Response.json(
        { error: "Em produção, a capa deve ter no máximo 4 MB. Comprima a imagem e tente novamente." },
        { status: 413 }
      );
    }

    let result: Awaited<ReturnType<typeof persistRoupaCoverFile>>;
    try {
      result = await persistRoupaCoverFile(roupaId, cover);
    } catch {
      return Response.json(
        { error: "Falha ao processar a imagem de capa. Tente novamente com um ficheiro menor." },
        { status: 500 }
      );
    }
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const newUrl = result.imageUrl;

    if (roupa.imagemUrl && roupa.imagemUrl !== newUrl && isDedicatedRoupaCoverFilename(roupa.imagemUrl)) {
      await unlinkPublicRoupaFile(roupa.imagemUrl);
    }

    const updated = await prisma.roupa.update({
      where: { id: roupaId },
      data: { imagemUrl: newUrl },
      select: { id: true, imagemUrl: true, ano: true, tema: true },
    });
    await logAdminAction(session, {
      action: "ROUPA_COVER_UPDATE",
      entityType: "ROUPA",
      entityId: roupaId,
      description: `Atualizou a capa da roupa ${updated.tema} (${updated.ano}) por upload.`,
      metadata: {
        roupaId,
        ano: updated.ano,
        tema: updated.tema,
        method: "upload",
        oldImageUrl: roupa.imagemUrl ?? null,
        newImageUrl: updated.imagemUrl ?? null,
      },
    });
    return Response.json({ success: true, roupa: updated });
  }

  const body = await req.json().catch(() => ({}));
  const imageUrlRaw = (body?.imageUrl ?? "").toString().trim();
  if (!imageUrlRaw) {
    return Response.json({ error: "Indique imageUrl (foto desta roupa)." }, { status: 400 });
  }
  if (!isRoupaImageUrlForRoupa(imageUrlRaw, roupaId)) {
    return Response.json(
      {
        error:
          "A imagem tem de ser desta roupa (URL em /roupas/… ou pasta roupas/… no Cloudinary).",
      },
      { status: 400 }
    );
  }

  const photo = await prisma.roupaPhoto.findFirst({
    where: { roupaId, imageUrl: imageUrlRaw },
    select: { id: true },
  });
  if (!photo) {
    return Response.json(
      { error: "Use uma foto já carregada na galeria desta roupa (ou faça upload da capa)." },
      { status: 400 }
    );
  }

  const old = roupa.imagemUrl;
  const updated = await prisma.roupa.update({
    where: { id: roupaId },
    data: { imagemUrl: imageUrlRaw },
    select: { id: true, imagemUrl: true, ano: true, tema: true },
  });

  if (old && old !== imageUrlRaw && isDedicatedRoupaCoverFilename(old)) {
    await unlinkPublicRoupaFile(old);
  }

  await logAdminAction(session, {
    action: "ROUPA_COVER_UPDATE",
    entityType: "ROUPA",
    entityId: roupaId,
    description: `Atualizou a capa da roupa ${updated.tema} (${updated.ano}) a partir da galeria.`,
    metadata: {
      roupaId,
      ano: updated.ano,
      tema: updated.tema,
      method: "gallery",
      oldImageUrl: old ?? null,
      newImageUrl: updated.imagemUrl ?? null,
    },
  });

  return Response.json({ success: true, roupa: updated });
}
