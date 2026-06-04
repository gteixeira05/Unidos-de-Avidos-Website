"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Upload, ZoomIn, ZoomOut } from "lucide-react";

const CANVAS_SIZE = 1080;
const MOLDURA_ORIG = 1254;
const CLIP_CX = (625 / MOLDURA_ORIG) * CANVAS_SIZE;
const CLIP_CY = (609 / MOLDURA_ORIG) * CANVAS_SIZE;
const CLIP_R  = (568 / MOLDURA_ORIG) * CANVAS_SIZE;

export default function MolduraPage() {
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const photoImgRef    = useRef<HTMLImageElement | null>(null);
  const frameImgRef    = useRef<HTMLImageElement | null>(null);
  const frameReadyRef  = useRef(false);
  const dragOriginRef  = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // Carrega a moldura uma vez
  useEffect(() => {
    const img = new Image();
    img.onload = () => { frameImgRef.current = img; frameReadyRef.current = true; };
    img.src = "/moldura2_2026.png";
  }, []);

  // Re-renderiza sempre que offset, scale ou photoLoaded mudam
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const photo  = photoImgRef.current;
    const frame  = frameImgRef.current;
    if (!canvas || !photo || !frame) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const baseScale = Math.max(CANVAS_SIZE / photo.naturalWidth, CANVAS_SIZE / photo.naturalHeight);
    const drawW = photo.naturalWidth  * baseScale * scale;
    const drawH = photo.naturalHeight * baseScale * scale;
    const drawX = CLIP_CX + offset.x - drawW / 2;
    const drawY = CLIP_CY + offset.y - drawH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CLIP_CX, CLIP_CY, CLIP_R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(photo, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.drawImage(frame, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, [offset, scale]);

  useEffect(() => {
    if (photoLoaded) render();
  }, [photoLoaded, render]);

  // Converte coordenadas do ecrã para coordenadas do canvas
  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width)  * CANVAS_SIZE,
      y: ((clientY - rect.top)  / rect.height) * CANVAS_SIZE,
    };
  };

  // --- Drag (rato) ---
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!photoLoaded) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    dragOriginRef.current = { mx: x, my: y, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const { mx, my, ox, oy } = dragOriginRef.current;
    setOffset({ x: ox + (x - mx), y: oy + (y - my) });
  };

  const onMouseUp = () => setIsDragging(false);

  // --- Drag (toque) ---
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!photoLoaded || e.touches.length !== 1) return;
    const t = e.touches[0];
    const { x, y } = toCanvasCoords(t.clientX, t.clientY);
    dragOriginRef.current = { mx: x, my: y, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    const { x, y } = toCanvasCoords(t.clientX, t.clientY);
    const { mx, my, ox, oy } = dragOriginRef.current;
    setOffset({ x: ox + (x - mx), y: oy + (y - my) });
  };

  const onTouchEnd = () => setIsDragging(false);

  // --- Carregar foto ---
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        photoImgRef.current = img;
        setOffset({ x: 0, y: 0 });
        setScale(1);
        setPhotoLoaded(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Download ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !photoLoaded) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "foto-marcha-unidos-avidos-2026.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const reset = () => {
    setPhotoLoaded(false);
    photoImgRef.current = null;
    setOffset({ x: 0, y: 0 });
    setScale(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
        Mostre o seu apoio
      </p>
      <h1 className="mt-2 text-3xl font-bold uppercase text-gray-900 sm:text-4xl">
        Moldura 2026
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-gray-600">
        Adicione a moldura oficial da Marcha Unidos de Avidos 2026 à sua foto e use-a
        como foto de perfil nas redes sociais!
      </p>

      {/* Zona de upload */}
      {!photoLoaded && (
        <div
          role="button"
          tabIndex={0}
          className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition ${
            isDraggingFile
              ? "border-[#00923f] bg-[#00923f]/10"
              : "border-gray-300 bg-gray-50 hover:border-[#00923f] hover:bg-[#00923f]/5"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
        >
          <ImageIcon size={52} className="text-gray-400" />
          <p className="mt-4 text-base font-semibold text-gray-700">
            Clique ou arraste a sua foto aqui
          </p>
          <p className="mt-1 text-sm text-gray-500">
            JPG, PNG, HEIC — qualquer formato de imagem
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Editor interativo */}
      {photoLoaded && (
        <div className="mt-10 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className={`w-full touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </div>

          <p className="text-center text-sm text-gray-500">
            Arraste a foto para a posicionar · use o slider para dar zoom
          </p>

          {/* Slider de zoom */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <ZoomOut size={18} className="shrink-0 text-gray-500" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-[#00923f]"
            />
            <ZoomIn size={18} className="shrink-0 text-gray-500" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00923f] px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#007a33]"
            >
              <Download size={18} aria-hidden />
              Guardar foto
            </button>
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
            >
              <Upload size={18} aria-hidden />
              Usar outra foto
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Guarde a imagem e use-a como foto de perfil no Facebook, Instagram ou WhatsApp!
          </p>
        </div>
      )}
    </div>
  );
}
