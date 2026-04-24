import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import {
  GALLERY_IMAGE_FORMAT_ERROR,
  isAllowedGalleryImageUrlPath,
  isDedicatedCoverFilename,
  isGalleryImageUrlForYear,
} from "@/lib/gallery-images";
import { persistGalleryCoverFromFile, unlinkPublicGalleryFile } from "@/lib/gallery-cover-upload";
import { logAdminAction } from "@/lib/admin-audit";
import { isCloudinaryImageUrl } from "@/lib/media/cloudinary";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const anoParam = url.searchParams.get("ano");
  if (anoParam) {
    const ano = Number(anoParam);
    if (!Number.isFinite(ano)) {
      return Response.json({ error: "Ano inválido." }, { status: 400 });
    }
    const item = await prisma.galleryYear.findUnique({
      where: { ano },
      select: { id: true, ano: true, title: true, coverImageUrl: true, createdAt: true, updatedAt: true },
    });
    if (!item) {
      return Response.json({ error: "Álbum não encontrado." }, { status: 404 });
    }
    return Response.json({ item });
  }

  const items = await prisma.galleryYear.findMany({
    orderBy: { ano: "desc" },
    select: { id: true, ano: true, title: true, coverImageUrl: true, createdAt: true, updatedAt: true },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  let ano: number;
  let coverImageUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const anoVal = formData.get("ano");
    ano = Number(anoVal);
    if (!Number.isFinite(ano)) {
      return Response.json({ error: "Ano inválido." }, { status: 400 });
    }
    const cover = formData.get("cover") as File | null;
    if (cover && cover.size > 0) {
      const result = await persistGalleryCoverFromFile(ano, cover);
      if ("error" in result) {
        return Response.json({ error: result.error }, { status: result.status });
      }
      coverImageUrl = result.coverImageUrl;
    }
  } else {
    const body = await req.json().catch(() => ({}));
    ano = Number(body?.ano);
    if (!Number.isFinite(ano)) {
      return Response.json({ error: "Ano inválido." }, { status: 400 });
    }
    coverImageUrl = (body?.coverImageUrl ?? "").toString().trim() || null;
    if (coverImageUrl && !isAllowedGalleryImageUrlPath(coverImageUrl)) {
      return Response.json({ error: GALLERY_IMAGE_FORMAT_ERROR }, { status: 400 });
    }
  }

  const item = await prisma.galleryYear.create({
    data: {
      ano,
      title: null,
      coverImageUrl,
    },
    select: { id: true, ano: true, title: true, coverImageUrl: true },
  });

  await logAdminAction(session, {
    action: "GALERIA_ANO_CREATE",
    entityType: "GALERIA_ANO",
    entityId: String(item.ano),
    description: `Criou álbum da galeria para ${item.ano}.`,
    metadata: { ano: item.ano, coverImageUrl: item.coverImageUrl ?? null },
  });

  return Response.json({ success: true, item }, { status: 201 });
}

/** Atualiza a foto de capa: multipart com `ano` + `cover`, ou JSON com `ano` + `coverImageUrl` (foto já no álbum). */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const ano = Number(formData.get("ano"));
    if (!Number.isFinite(ano)) {
      return Response.json({ error: "Ano inválido." }, { status: 400 });
    }
    const cover = formData.get("cover") as File | null;
    if (!cover || cover.size === 0) {
      return Response.json({ error: "Selecione uma imagem para a capa." }, { status: 400 });
    }

    const year = await prisma.galleryYear.findUnique({
      where: { ano },
      select: { id: true, coverImageUrl: true },
    });
    if (!year) {
      return Response.json({ error: "Álbum não encontrado." }, { status: 404 });
    }

    const result = await persistGalleryCoverFromFile(ano, cover);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const newUrl = result.coverImageUrl;

    const shouldKeepOldCloudinaryCoverAsset =
      !!year.coverImageUrl &&
      isCloudinaryImageUrl(year.coverImageUrl) &&
      isDedicatedCoverFilename(year.coverImageUrl) &&
      isCloudinaryImageUrl(newUrl) &&
      isDedicatedCoverFilename(newUrl);

    if (
      year.coverImageUrl &&
      year.coverImageUrl !== newUrl &&
      isDedicatedCoverFilename(year.coverImageUrl) &&
      !shouldKeepOldCloudinaryCoverAsset
    ) {
      await unlinkPublicGalleryFile(year.coverImageUrl);
    }

    const item = await prisma.galleryYear.update({
      where: { ano },
      data: { coverImageUrl: newUrl },
      select: { id: true, ano: true, title: true, coverImageUrl: true },
    });
    await logAdminAction(session, {
      action: "GALERIA_CAPA_UPDATE",
      entityType: "GALERIA_ANO",
      entityId: String(item.ano),
      description: `Atualizou capa da galeria de ${item.ano} por upload.`,
      metadata: { ano: item.ano, method: "upload", newCoverImageUrl: item.coverImageUrl ?? null },
    });
    return Response.json({ success: true, item });
  }

  const body = await req.json().catch(() => ({}));
  const ano = Number(body?.ano);
  const coverImageUrlRaw = (body?.coverImageUrl ?? "").toString().trim();
  if (!Number.isFinite(ano)) {
    return Response.json({ error: "Ano inválido." }, { status: 400 });
  }
  if (!coverImageUrlRaw) {
    return Response.json({ error: "Indique coverImageUrl (foto deste álbum)." }, { status: 400 });
  }
  if (!isAllowedGalleryImageUrlPath(coverImageUrlRaw)) {
    return Response.json({ error: GALLERY_IMAGE_FORMAT_ERROR }, { status: 400 });
  }
  if (!isGalleryImageUrlForYear(coverImageUrlRaw, ano)) {
    return Response.json(
      { error: "A imagem tem de estar na pasta deste ano na galeria." },
      { status: 400 }
    );
  }

  const year = await prisma.galleryYear.findUnique({
    where: { ano },
    select: { id: true, coverImageUrl: true },
  });
  if (!year) {
    return Response.json({ error: "Álbum não encontrado." }, { status: 404 });
  }

  const photo = await prisma.galleryPhoto.findFirst({
    where: { yearId: year.id, imageUrl: coverImageUrlRaw },
    select: { id: true },
  });
  if (!photo) {
    return Response.json(
      { error: "Apenas pode usar como capa uma foto que já exista neste álbum." },
      { status: 400 }
    );
  }

  const oldCover = year.coverImageUrl;
  const item = await prisma.galleryYear.update({
    where: { ano },
    data: { coverImageUrl: coverImageUrlRaw },
    select: { id: true, ano: true, title: true, coverImageUrl: true },
  });

  if (oldCover && oldCover !== coverImageUrlRaw && isDedicatedCoverFilename(oldCover)) {
    await unlinkPublicGalleryFile(oldCover);
  }

  await logAdminAction(session, {
    action: "GALERIA_CAPA_UPDATE",
    entityType: "GALERIA_ANO",
    entityId: String(item.ano),
    description: `Atualizou capa da galeria de ${item.ano} com foto existente.`,
    metadata: { ano: item.ano, method: "existing", newCoverImageUrl: item.coverImageUrl ?? null },
  });

  return Response.json({ success: true, item });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Sem permissões." }, { status: 403 });

  const url = new URL(req.url);
  const ano = url.searchParams.get("ano");
  if (!ano) return Response.json({ error: "Ano é obrigatório." }, { status: 400 });

  await prisma.galleryYear.delete({ where: { ano: Number(ano) } });
  await logAdminAction(session, {
    action: "GALERIA_ANO_DELETE",
    entityType: "GALERIA_ANO",
    entityId: ano,
    description: `Eliminou o álbum da galeria de ${ano}.`,
    metadata: { ano: Number(ano) },
  });
  return Response.json({ success: true });
}
