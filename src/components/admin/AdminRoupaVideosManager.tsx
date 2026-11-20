"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { btnPerigo, btnPrimario, inputClass, Mensagem, pedido } from "@/components/admin/Form";
import { formatarDuracao, MAX_VIDEO_BYTES, proporcaoVideo, urlCapaVideo, urlVideoOtimizado } from "@/lib/media/video-urls";

type Video = { id: string; url: string; titulo: string | null; duracao: number | null; largura: number | null; altura: number | null };
type Assinatura = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  eager: string;
  eager_async: string;
};

/** Envia o ficheiro diretamente para o Cloudinary, com progresso (0–100). */
function enviarParaCloudinary(file: File, a: Assinatura, onProgresso: (p: number) => void): Promise<{ public_id: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", a.apiKey);
    fd.append("timestamp", String(a.timestamp));
    fd.append("signature", a.signature);
    fd.append("folder", a.folder);
    fd.append("eager", a.eager);
    fd.append("eager_async", a.eager_async);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${a.cloudName}/video/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgresso(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const r = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) resolve(r);
      else reject(new Error(r?.error?.message ?? "O Cloudinary recusou o vídeo."));
    };
    xhr.onerror = () => reject(new Error("Falha de ligação durante o envio. Tente novamente."));
    xhr.send(fd);
  });
}

export default function AdminRoupaVideosManager({ roupaId }: { roupaId: string }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const carregar = useCallback(() => {
    pedido<{ items: Video[] }>(`/api/admin/roupas/${roupaId}/videos`)
      .then((d) => setVideos(d.items))
      .catch((e) => setErro(e.message));
  }, [roupaId]);
  useEffect(carregar, [carregar]);

  async function enviar(file: File) {
    setErro(null);
    setOk(null);
    if (!file.type.startsWith("video/")) return setErro("Escolha um ficheiro de vídeo (MP4 ou MOV).");
    if (file.size > MAX_VIDEO_BYTES) {
      return setErro(
        `O vídeo tem ${Math.round(file.size / 1048576)} MB; o máximo é 100 MB. Encurte-o ou exporte em 1080p (ver dicas abaixo).`
      );
    }
    try {
      setProgresso(0);
      const a = await pedido<Assinatura>(`/api/admin/roupas/${roupaId}/videos/assinatura`, { method: "POST" });
      const r = await enviarParaCloudinary(file, a, setProgresso);
      await pedido(`/api/admin/roupas/${roupaId}/videos`, {
        method: "POST",
        body: JSON.stringify({ publicId: r.public_id, titulo }),
      });
      setTitulo("");
      setOk("Vídeo adicionado. A versão otimizada pode demorar 1–2 minutos a ficar pronta no site.");
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setProgresso(null);
    }
  }

  async function guardarTitulo(v: Video, novo: string) {
    if ((v.titulo ?? "") === novo) return;
    try {
      await pedido(`/api/admin/roupas/${roupaId}/videos/${v.id}`, { method: "PATCH", body: JSON.stringify({ titulo: novo }) });
      setOk("Título guardado.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function apagar(v: Video) {
    if (!confirm("Apagar este vídeo? Também é removido do Cloudinary.")) return;
    try {
      await pedido(`/api/admin/roupas/${roupaId}/videos/${v.id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const aEnviar = progresso !== null;

  return (
    <section className="rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-gray-900">Vídeos da roupa (admin)</h2>
      <p className="mt-1 text-sm text-gray-600">
        Aparecem na página da roupa, por baixo das fotos. O site mostra sempre uma versão otimizada.
      </p>

      <div className="mt-4 space-y-3">
        <Mensagem erro={erro} ok={ok} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            aria-label="Título do vídeo (opcional)"
            placeholder="Título (opcional), ex.: Pormenores do figurino"
            maxLength={120}
            value={titulo}
            disabled={aEnviar}
            onChange={(e) => setTitulo(e.target.value)}
            className={`${inputClass} sm:flex-1`}
          />
          <label className={`${btnPrimario} inline-flex cursor-pointer items-center justify-center gap-2 ${aEnviar ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="h-4 w-4" aria-hidden />
            {aEnviar ? "A enviar…" : "Enviar vídeo"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              className="sr-only"
              disabled={aEnviar}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void enviar(f);
              }}
            />
          </label>
        </div>

        {aEnviar && (
          <div aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-[#00923f] transition-all" style={{ width: `${progresso}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-600">
              {progresso! < 100 ? `A enviar… ${progresso}%` : "A processar no Cloudinary…"} Não feche a página.
            </p>
          </div>
        )}

        <details className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
          <summary className="cursor-pointer font-medium">Dicas para o vídeo ficar bom e leve</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Formato <strong>MP4</strong> (H.264) ou o <strong>MOV</strong> do iPhone — os dois servem.</li>
            <li>Resolução <strong>1080p</strong> chega (o site mostra no máximo 1280 px). Evite 4K: fica pesado sem ganho.</li>
            <li>Duração ideal <strong>30 s a 2 min</strong>; máximo <strong>100 MB</strong> por vídeo.</li>
            <li>Grave na <strong>horizontal</strong>, com boa luz; o som pode ser desligado.</li>
            <li>No iPhone: Definições → Câmara → Gravar vídeo → <strong>1080p a 30 fps</strong>.</li>
          </ul>
        </details>

        {videos === null ? (
          <p className="text-sm text-gray-500">A carregar…</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-gray-600">Ainda não há vídeos nesta roupa.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <li key={v.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <video
                  src={urlVideoOtimizado(v.url)}
                  poster={urlCapaVideo(v.url)}
                  controls
                  preload="none"
                  playsInline
                  style={{ aspectRatio: proporcaoVideo(v.largura, v.altura) }}
                  className="mx-auto block max-h-80 w-full bg-black object-contain"
                />
                <div className="flex items-center gap-2 p-2">
                  <input
                    aria-label="Título do vídeo"
                    defaultValue={v.titulo ?? ""}
                    placeholder="Sem título"
                    maxLength={120}
                    onBlur={(e) => guardarTitulo(v, e.target.value.trim())}
                    className={`${inputClass} flex-1`}
                  />
                  {v.duracao ? <span className="text-xs tabular-nums text-gray-500">{formatarDuracao(v.duracao)}</span> : null}
                  <button type="button" onClick={() => apagar(v)} aria-label="Apagar vídeo" className={btnPerigo}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
