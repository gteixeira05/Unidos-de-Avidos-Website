import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { exigirAdmin } from "@/lib/conteudos-admin";
import { ROUPA_IMAGE_FORMAT_ERROR, galleryExtFromUpload, isAllowedGalleryUpload } from "@/lib/roupa-images";
import { errorMessageForImageProcessing, normalizeGalleryImageForWeb } from "@/lib/gallery-upload-process";
import { storeProcessedWebImage } from "@/lib/media/store-web-image";
import { MAX_ADMIN_IMAGE_UPLOAD_BYTES } from "@/lib/upload-limits";

/** Upload de uma imagem para conteúdos (ex.: eventos da agenda). Devolve o URL. */
export async function POST(req: NextRequest) {
  const s = await exigirAdmin(req);
  if (s instanceof Response) return s;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Escolha uma imagem." }, { status: 400 });
  const ext = galleryExtFromUpload(file);
  if (!isAllowedGalleryUpload(file) || !ext) return Response.json({ error: ROUPA_IMAGE_FORMAT_ERROR }, { status: 400 });
  if (file.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
    return Response.json({ error: "A imagem deve ter no máximo 100 MB." }, { status: 400 });
  }

  try {
    const { buffer, ext: outExt } = await normalizeGalleryImageForWeb(Buffer.from(await file.arrayBuffer()), ext);
    const { url } = await storeProcessedWebImage(buffer, outExt, {
      kind: "conteudo",
      filename: `${randomUUID()}.${outExt}`,
    });
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: errorMessageForImageProcessing(err) }, { status: 400 });
  }
}
