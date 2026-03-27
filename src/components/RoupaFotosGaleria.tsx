"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type RoupaFotoItem = { id: string; imageUrl: string };

function orderPhotosWithCoverFirst(photos: RoupaFotoItem[], imagemUrl: string | null): RoupaFotoItem[] {
  if (!photos.length) return [];
  if (!imagemUrl) return photos;
  const idx = photos.findIndex((p) => p.imageUrl === imagemUrl);
  if (idx <= 0) return photos;
  const next = [...photos];
  const [capa] = next.splice(idx, 1);
  return [capa, ...next];
}

export default function RoupaFotosGaleria({
  tema,
  ano,
  photos,
  imagemUrl,
}: {
  tema: string;
  ano: number;
  photos: RoupaFotoItem[];
  imagemUrl: string | null;
}) {
  const items = orderPhotosWithCoverFirst(photos, imagemUrl);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const suppressNextClick = useRef(false);

  const count = items.length;
  const safeIndex = Math.min(index, Math.max(0, count - 1));
  const current = items[safeIndex] ?? null;

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(count - 1, i + 1));
  }, [count]);

  const canGoPrev = safeIndex > 0;
  const canGoNext = safeIndex < count - 1;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, goPrev, goNext, closeLightbox]);

  if (!count || !current) {
    return (
      <div className="mt-4 flex aspect-[16/10] w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
        Ainda não há fotos desta roupa.
      </div>
    );
  }

  const altBase = `${tema} — ${ano}`;

  const lightbox =
    lightboxOpen &&
    current &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Fotografia em grande"
      >
        {/* Fundo: tap/click fecha — sempre por baixo do conteúdo interativo */}
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 z-0 cursor-default bg-black/92"
          aria-label="Fechar galeria"
          onClick={closeLightbox}
        />

        {/* Fechar — sempre visível por cima de tudo */}
        <button
          type="button"
          onClick={closeLightbox}
          className="absolute right-3 top-3 z-[10002] flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/95 text-gray-800 shadow-sm transition hover:bg-white sm:right-4 sm:top-4"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Área central: só a imagem captura toques; o resto passa para o fundo */}
        <div className="pointer-events-none absolute inset-0 z-[10001] flex flex-1 flex-col items-center justify-center px-3 pb-16 pt-16 sm:px-8">
          <div
            className="pointer-events-auto max-h-[min(85vh,880px)] max-w-full"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Image
              src={current.imageUrl}
              alt={`${altBase} — foto ${safeIndex + 1} de ${count}`}
              width={1920}
              height={1280}
              className="max-h-[min(85vh,880px)] w-auto max-w-[min(100vw-1.5rem,1200px)] object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>

        {count > 1 ? (
          <>
            {canGoPrev ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 top-1/2 z-[10002] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/50 sm:left-5"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
            {canGoNext ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 top-1/2 z-[10002] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/50 sm:right-5"
                aria-label="Foto seguinte"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
            <p className="pointer-events-none absolute bottom-5 left-1/2 z-[10002] -translate-x-1/2 rounded-md bg-black/45 px-2.5 py-1 text-xs font-medium tabular-nums text-white/95 backdrop-blur-sm">
              {safeIndex + 1} / {count}
            </p>
          </>
        ) : (
          <p className="pointer-events-none absolute bottom-5 left-1/2 z-[10002] -translate-x-1/2 rounded-md bg-black/45 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
            Toque fora da imagem ou em ✕ para fechar
          </p>
        )}
      </div>,
      document.body
    );

  return (
    <div className="mt-4 space-y-4">
      {/* Imagem principal */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200/90 bg-gray-100 shadow-sm">
        {/* Camada da foto (sem cobrir os controlos) */}
        <div className="absolute inset-0">
          <Image
            src={current.imageUrl}
            alt={`${altBase} — foto ${safeIndex + 1} de ${count}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority={index === 0}
          />
        </div>

        {/* Toque na imagem para abrir lightbox — não cobre os botões (z-index mais baixo) */}
        <button
          type="button"
          onClick={() => {
            if (suppressNextClick.current) {
              suppressNextClick.current = false;
              return;
            }
            setLightboxOpen(true);
          }}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null || count <= 1) {
              touchStartX.current = null;
              return;
            }
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const dx = endX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) < 50) return;
            suppressNextClick.current = true;
            if (dx < 0) goNext();
            else goPrev();
          }}
          className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#00923f] focus-visible:ring-offset-2"
          aria-label="Ver fotografia em grande"
        />

        {count > 1 && canGoPrev ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/15 text-white shadow-sm backdrop-blur-md transition hover:bg-white/25 sm:left-3"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
        {count > 1 && canGoNext ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/15 text-white shadow-sm backdrop-blur-md transition hover:bg-white/25 sm:right-3"
            aria-label="Foto seguinte"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}

        {/* Ampliar — discreto */}
        <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-end p-2.5 sm:p-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-[#00923f]/95 text-white shadow-sm transition hover:bg-[#007a33] active:scale-95 sm:h-9 sm:w-9"
            aria-label="Abrir em ecrã inteiro"
          >
            <Maximize2 className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {count > 1 ? (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium tabular-nums text-white/95 backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-xs">
            {safeIndex + 1} / {count}
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <div
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 pt-0.5 [scrollbar-width:thin]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition sm:h-24 sm:w-24 ${
                i === safeIndex
                  ? "border-[#00923f] ring-1 ring-[#00923f]/25"
                  : "border-gray-200/90 opacity-90 hover:border-gray-300 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === safeIndex ? "true" : undefined}
            >
              <Image
                src={p.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox}
    </div>
  );
}
