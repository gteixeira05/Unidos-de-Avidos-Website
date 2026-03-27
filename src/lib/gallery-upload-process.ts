import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const heicConvert = require("heic-convert") as (opts: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<Buffer | ArrayBuffer>;

const MAX_EDGE = 8192;

/**
 * Converte/normaliza imagens de upload para o formato final em disco.
 * HEIC/HEIF → JPEG. Outros: rotação EXIF + limite de dimensão + recompressão leve.
 * GIF: pass-through (preserva animação).
 */
export async function normalizeGalleryImageForWeb(
  input: Buffer,
  logicalExt: string
): Promise<{ buffer: Buffer; ext: string }> {
  const e = logicalExt.toLowerCase() === "jpeg" ? "jpg" : logicalExt.toLowerCase();

  if (e === "gif") {
    return { buffer: input, ext: "gif" };
  }

  const resizeOpts = {
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside" as const,
    withoutEnlargement: true,
  };

  if (e === "heic" || e === "heif") {
    let jpegBuffer: Buffer;
    try {
      const raw = await heicConvert({ buffer: input, format: "JPEG", quality: 0.92 });
      jpegBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    } catch {
      try {
        jpegBuffer = await sharp(input, { failOn: "none" }).rotate().jpeg({ quality: 88 }).toBuffer();
      } catch {
        throw new Error("HEIC_CONVERSÃO");
      }
    }
    const out = await sharp(jpegBuffer, { failOn: "none" })
      .rotate()
      .resize(resizeOpts)
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    return { buffer: out, ext: "jpg" };
  }

  if (e === "jpg" || e === "jpeg") {
    const out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(resizeOpts)
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    return { buffer: out, ext: "jpg" };
  }

  if (e === "png") {
    const out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(resizeOpts)
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { buffer: out, ext: "png" };
  }

  if (e === "webp") {
    const out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(resizeOpts)
      .webp({ quality: 85 })
      .toBuffer();
    return { buffer: out, ext: "webp" };
  }

  /**
   * DNG (Adobe / Apple ProRAW): muitos são TIFF-based; o libvips (Sharp) consegue ler vários.
   * Em ambientes sem suporte (ex.: alguns builds Linux), falha → mensagem amigável.
   */
  if (e === "dng") {
    try {
      const out = await sharp(input, {
        failOn: "none",
        sequentialRead: true,
        limitInputPixels: 268_402_689,
      })
        .rotate()
        .resize(resizeOpts)
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
      return { buffer: out, ext: "jpg" };
    } catch {
      throw new Error("DNG_CONVERSÃO");
    }
  }

  throw new Error("FORMATO_NÃO_SUPORTADO");
}

/** Mensagem para mostrar ao utilizador quando `normalizeGalleryImageForWeb` falha. */
export function errorMessageForImageProcessing(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  if (code === "HEIC_CONVERSÃO") {
    return "Não foi possível converter a foto HEIC. Tente exportar como JPG ou use outra imagem.";
  }
  if (code === "DNG_CONVERSÃO") {
    return "Não foi possível converter o DNG (ProRAW) neste ambiente. Nas Fotos: abrir a foto → Partilhar → «Guardar imagem» ou exportar como JPG e enviar de novo.";
  }
  return "Não foi possível processar a imagem. Use JPG, PNG ou WebP.";
}
