import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  GALLERY_IMAGE_FORMAT_ERROR,
  galleryExtFromUpload,
  isAllowedGalleryImageUrlPath,
  isAllowedGalleryUpload,
} from "@/lib/gallery-images";
import {
  dngFallbackCloudinaryFolder,
  isCloudinaryConfigured,
  tryUploadDngFallbackToCloudinaryEagerJpeg,
} from "@/lib/media/cloudinary";
import { removeStoredMediaAsset } from "@/lib/media/remove-stored-asset";
import { storeProcessedWebImage } from "@/lib/media/store-web-image";
import {
  errorMessageForImageProcessing,
  normalizeGalleryImageForWeb,
} from "@/lib/gallery-upload-process";
import { MAX_ADMIN_IMAGE_UPLOAD_BYTES } from "@/lib/upload-limits";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const ano = url.searchParams.get("ano");
  if (!ano) return Response.json({ error: "Ano é obrigatório." }, { status: 400 });

  const year = await prisma.galleryYear.findUnique({
    where: { ano: Number(ano) },
    select: { id: true, ano: true },
  });
  if (!year) return Response.json({ items: [] }, { status: 200 });

  const items = await prisma.galleryPhoto.findMany({
    where: { yearId: year.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, imageUrl: true, caption: true, order: true, createdAt: true },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const anoVal = formData.get("ano");
    const ano = Number(anoVal);
    if (!Number.isFinite(ano)) {
      return Response.json({ error: "Ano inválido." }, { status: 400 });
    }
    const year = await prisma.galleryYear.findUnique({
      where: { ano },
      select: { id: true },
    });
    if (!year) return Response.json({ error: "Ano não existe." }, { status: 404 });

    const files: File[] = [];
    const list = formData.getAll("files");
    for (const f of list) {
      if (f instanceof File && f.size > 0) files.push(f);
    }

    if (!files.length) {
      return Response.json({ error: "Selecione pelo menos uma foto." }, { status: 400 });
    }

    for (const file of files) {
      if (!isAllowedGalleryUpload(file)) {
        return Response.json({ error: GALLERY_IMAGE_FORMAT_ERROR }, { status: 400 });
      }
      if (file.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
        return Response.json({ error: "Cada ficheiro deve ter no máximo 100 MB." }, { status: 400 });
      }
    }

    const created: { id: string; imageUrl: string; order: number }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const logicalExt = galleryExtFromUpload(file);
      if (!logicalExt) {
        return Response.json({ error: GALLERY_IMAGE_FORMAT_ERROR }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const inputBuf = Buffer.from(bytes);
      let outBuf: Buffer;
      let outExt: string;
      try {
        const processed = await normalizeGalleryImageForWeb(inputBuf, logicalExt);
        outBuf = processed.buffer;
        outExt = processed.ext;
      } catch (err) {
        const code = err instanceof Error ? err.message : "";
        if (code === "DNG_CONVERSÃO" && isCloudinaryConfigured()) {
          const folder = dngFallbackCloudinaryFolder("galeria-photo", { ano });
          const fallbackUrl = await tryUploadDngFallbackToCloudinaryEagerJpeg(inputBuf, {
            folder,
            publicId: `${Date.now()}-${i}-dng`,
          });
          if (fallbackUrl) {
            const item = await prisma.galleryPhoto.create({
              data: { yearId: year.id, imageUrl: fallbackUrl, caption: null, order: i },
              select: { id: true, imageUrl: true, order: true },
            });
            created.push(item);
            continue;
          }
        }
        return Response.json({ error: errorMessageForImageProcessing(err) }, { status: 400 });
      }
      const filename = `${Date.now()}-${i}.${outExt}`;
      const stored = await storeProcessedWebImage(outBuf, outExt, {
        kind: "gallery",
        ano,
        filename,
      });
      const item = await prisma.galleryPhoto.create({
        data: { yearId: year.id, imageUrl: stored.url, caption: null, order: i },
        select: { id: true, imageUrl: true, order: true },
      });
      created.push(item);
    }

    await logAdminAction(session, {
      action: "GALERIA_PHOTO_UPLOAD",
      entityType: "GALERIA_ANO",
      entityId: String(ano),
      description: `Carregou ${created.length} foto(s) na galeria de ${ano}.`,
      metadata: { ano, total: created.length, photoIds: created.map((c) => c.id) },
    });

    return Response.json({ success: true, items: created }, { status: 201 });
  }

  const body = await req.json().catch(() => ({}));
  const ano = Number(body?.ano);
  const imageUrl = (body?.imageUrl ?? "").toString().trim();
  const caption = body?.caption !== undefined ? (body.caption?.toString() ?? null) : null;
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0;

  if (!Number.isFinite(ano) || !imageUrl) {
    return Response.json({ error: "Parâmetros inválidos (ano, imageUrl)." }, { status: 400 });
  }

  if (!isAllowedGalleryImageUrlPath(imageUrl)) {
    return Response.json({ error: GALLERY_IMAGE_FORMAT_ERROR }, { status: 400 });
  }

  const year = await prisma.galleryYear.findUnique({
    where: { ano },
    select: { id: true },
  });
  if (!year) return Response.json({ error: "Ano não existe." }, { status: 404 });

  const item = await prisma.galleryPhoto.create({
    data: { yearId: year.id, imageUrl, caption, order },
    select: { id: true, imageUrl: true, caption: true, order: true, createdAt: true },
  });

  await logAdminAction(session, {
    action: "GALERIA_PHOTO_CREATE",
    entityType: "GALERIA_ANO",
    entityId: String(ano),
    description: `Adicionou uma foto por URL na galeria de ${ano}.`,
    metadata: { ano, photoId: item.id, imageUrl: item.imageUrl },
  });

  return Response.json({ success: true, item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id é obrigatório." }, { status: 400 });

  const photo = await prisma.galleryPhoto.findUnique({
    where: { id },
    select: { imageUrl: true, yearId: true },
  });
  if (!photo) return Response.json({ error: "Foto não encontrada." }, { status: 404 });

  const year = await prisma.galleryYear.findUnique({
    where: { id: photo.yearId },
    select: { ano: true },
  });

  await prisma.galleryPhoto.delete({ where: { id } });
  await removeStoredMediaAsset(photo.imageUrl);
  await logAdminAction(session, {
    action: "GALERIA_PHOTO_DELETE",
    entityType: "GALERIA_FOTO",
    entityId: id,
    description: `Eliminou uma foto da galeria${year?.ano ? ` de ${year.ano}` : ""}.`,
    metadata: { photoId: id, ano: year?.ano ?? null, imageUrl: photo.imageUrl },
  });
  return Response.json({ success: true });
}

