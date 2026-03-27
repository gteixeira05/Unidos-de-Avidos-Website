import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  ROUPA_IMAGE_FORMAT_ERROR,
  galleryExtFromUpload,
  isAllowedGalleryUpload,
} from "@/lib/roupa-images";
import { persistRoupaPhotoFile } from "@/lib/roupa-photo-upload";
import { unlinkPublicRoupaFile } from "@/lib/roupa-files";
import { MAX_ADMIN_IMAGE_UPLOAD_BYTES } from "@/lib/upload-limits";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(_req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id: roupaId } = await params;
  const roupa = await prisma.roupa.findUnique({
    where: { id: roupaId },
    select: { id: true },
  });
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });

  const items = await prisma.roupaPhoto.findMany({
    where: { roupaId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, imageUrl: true, order: true, createdAt: true },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id: roupaId } = await params;
  const roupa = await prisma.roupa.findUnique({
    where: { id: roupaId },
    select: { id: true, ano: true, tema: true },
  });
  if (!roupa) return Response.json({ error: "Roupa não encontrada." }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Envie multipart/form-data com o campo files." }, { status: 400 });
  }

  const formData = await req.formData();
  const files: File[] = [];
  for (const f of formData.getAll("files")) {
    if (f instanceof File && f.size > 0) files.push(f);
  }
  if (!files.length) {
    return Response.json({ error: "Selecione pelo menos uma foto." }, { status: 400 });
  }

  for (const file of files) {
    if (!isAllowedGalleryUpload(file)) {
      return Response.json({ error: ROUPA_IMAGE_FORMAT_ERROR }, { status: 400 });
    }
    if (file.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
      return Response.json({ error: "Cada ficheiro deve ter no máximo 100 MB." }, { status: 400 });
    }
  }

  const maxAgg = await prisma.roupaPhoto.aggregate({
    where: { roupaId },
    _max: { order: true },
  });
  let orderBase = (maxAgg._max.order ?? -1) + 1;

  const created: { id: string; imageUrl: string; order: number }[] = [];
  const ts = Date.now();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const logicalExt = galleryExtFromUpload(file);
    if (!logicalExt) {
      return Response.json({ error: ROUPA_IMAGE_FORMAT_ERROR }, { status: 400 });
    }
    const basename = `${ts}-${i}`;
    const result = await persistRoupaPhotoFile(roupaId, file, basename);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const item = await prisma.roupaPhoto.create({
      data: {
        roupaId,
        imageUrl: result.imageUrl,
        order: orderBase++,
      },
      select: { id: true, imageUrl: true, order: true },
    });
    created.push(item);
  }

  await logAdminAction(session, {
    action: "ROUPA_PHOTO_UPLOAD",
    entityType: "ROUPA",
    entityId: roupaId,
    description: `Carregou ${created.length} foto(s) para a roupa ${roupa.tema} (${roupa.ano}).`,
    metadata: { roupaId, ano: roupa.ano, tema: roupa.tema, total: created.length },
  });

  return Response.json({ success: true, items: created }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const { id: roupaId } = await params;
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId");
  if (!photoId) return Response.json({ error: "photoId é obrigatório." }, { status: 400 });

  const photo = await prisma.roupaPhoto.findFirst({
    where: { id: photoId, roupaId },
    select: { id: true, imageUrl: true },
  });
  if (!photo) return Response.json({ error: "Foto não encontrada." }, { status: 404 });

  const roupa = await prisma.roupa.findUnique({
    where: { id: roupaId },
    select: { imagemUrl: true, ano: true, tema: true },
  });

  await prisma.roupaPhoto.delete({ where: { id: photoId } });

  if (roupa?.imagemUrl === photo.imageUrl) {
    await prisma.roupa.update({
      where: { id: roupaId },
      data: { imagemUrl: null },
    });
  }

  await unlinkPublicRoupaFile(photo.imageUrl);

  await logAdminAction(session, {
    action: "ROUPA_PHOTO_DELETE",
    entityType: "ROUPA",
    entityId: roupaId,
    description: `Eliminou uma foto da roupa ${roupa?.tema ?? "—"} (${roupa?.ano ?? "—"}).`,
    metadata: { roupaId, ano: roupa?.ano, tema: roupa?.tema, photoId },
  });

  return Response.json({ success: true });
}
