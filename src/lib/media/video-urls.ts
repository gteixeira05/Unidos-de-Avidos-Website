/**
 * URLs de entrega dos vídeos no Cloudinary (sem SDK: pode ser usado no browser).
 * O vídeo original fica guardado; o site mostra sempre uma versão otimizada.
 */

/** MP4 H.264 (toca em todos os browsers), lado maior até 1280 px (horizontais e verticais), qualidade automática. */
export const TRANSFORMACAO_VIDEO = "vc_h264,q_auto,w_1280,h_1280,c_limit";
const TRANSFORMACAO_CAPA = "so_1,w_1280,h_1280,c_limit,q_auto";

function comTransformacao(url: string, t: string, ext: string): string {
  if (!url.includes("/video/upload/")) return url;
  return url.replace("/video/upload/", `/video/upload/${t}/`).replace(/\.[a-z0-9]+(\?.*)?$/i, `.${ext}`);
}

export function urlVideoOtimizado(url: string): string {
  return comTransformacao(url, TRANSFORMACAO_VIDEO, "mp4");
}

/** Imagem de capa: o fotograma do 1.º segundo. */
export function urlCapaVideo(url: string): string {
  return comTransformacao(url, TRANSFORMACAO_CAPA, "jpg");
}

/** 75 → "1:15" */
export function formatarDuracao(segundos: number | null | undefined): string {
  if (!segundos || segundos < 0) return "";
  const s = Math.round(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Proporção para a caixa do vídeo (os verticais não ficam com faixas pretas). 16:9 se não se souber. */
export function proporcaoVideo(largura: number | null | undefined, altura: number | null | undefined): string {
  return largura && altura ? `${largura} / ${altura}` : "16 / 9";
}

/** Limite de tamanho por vídeo no plano gratuito do Cloudinary. */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
