"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
export type GaleriaAlbumPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

type Props = {
  ano: string;
  photos: GaleriaAlbumPhoto[];
  adminFooter?: (photo: GaleriaAlbumPhoto) => ReactNode;
};

export default function GaleriaAlbumGrid({ ano, photos, adminFooter }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const suppressNextClick = useRef(false);

  const count = photos.length;
  const safeLb =
    lightboxIndex !== null
      ? Math.min(Math.max(0, lightboxIndex), Math.max(0, count - 1))
      : 0;
  const current = photos[safeLb] ?? null;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : Math.max(0, i - 1)));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : Math.min(count - 1, i + 1)
    );
  }, [count]);

  const openAt = useCallback((i: number) => setLightboxIndex(i), []);

  const canGoPrev = lightboxIndex !== null && safeLb > 0;
  const canGoNext = lightboxIndex !== null && safeLb < count - 1;

  useEffect(() => {
    if (lightboxIndex === null) return;
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
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  const lightbox =
    lightboxIndex !== null &&
    current &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Fotografia em grande"
      >
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 z-0 cursor-default bg-black/92"
          aria-label="Fechar galeria"
          onClick={closeLightbox}
        />

        <button
          type="button"
          onClick={closeLightbox}
          className="absolute right-3 top-3 z-[10002] flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/95 text-gray-800 shadow-sm transition hover:bg-white sm:right-4 sm:top-4"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="pointer-events-none absolute inset-0 z-[10001] flex flex-col pt-14 pb-[4.5rem] sm:pt-16 sm:pb-20">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 sm:px-4">
            <div
              className="pointer-events-auto flex w-full max-w-[min(100vw,1600px)] flex-col items-center"
              onClick={(e) => e.stopPropagation()}
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
            >
              {/* fill + object-contain numa área quase a ecrã inteiro: foto o maior possível; key evita “fantasma” da foto anterior */}
              <div className="relative h-[min(82dvh,calc(100svh-10rem))] w-full bg-black">
                <Image
                  key={current.id}
                  src={current.imageUrl}
                  alt={current.caption ?? `Foto ${ano}`}
                  fill
                  className="object-contain object-center"
                  sizes="100vw"
                  priority
                  draggable={false}
                />
              </div>
              {current.caption ? (
                <p className="mt-3 max-w-full px-2 text-center text-sm text-white/90">
                  {current.caption}
                </p>
              ) : null}
            </div>
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
                className="absolute left-2 top-1/2 z-[10002] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/50 sm:left-5 sm:h-12 sm:w-12"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
              </button>
            ) : null}
            {canGoNext ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 top-1/2 z-[10002] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/50 sm:right-5 sm:h-12 sm:w-12"
                aria-label="Foto seguinte"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
              </button>
            ) : null}
            <p className="pointer-events-none absolute bottom-5 left-1/2 z-[10002] -translate-x-1/2 rounded-md bg-black/45 px-2.5 py-1 text-xs font-medium tabular-nums text-white/95 backdrop-blur-sm">
              {safeLb + 1} / {count}
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
    <>
      <p className="mt-8 flex items-center gap-2 text-sm text-gray-600 sm:mt-10">
        <Maximize2 className="h-4 w-4 shrink-0 text-[#00923f]" aria-hidden />
        <span>
          Toque ou clique numa fotografia para a ver em <strong className="font-semibold text-gray-800">ecrã inteiro</strong>{" "}
          e navegar com as setas.
        </span>
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => {
                if (suppressNextClick.current) {
                  suppressNextClick.current = false;
                  return;
                }
                openAt(i);
              }}
              className="group relative block w-full cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00923f]"
              aria-label={`Ver fotografia ${i + 1} em grande`}
            >
              {/* object-contain: mostra a foto inteira (evita cortar caras). Fundo neutro nas margens. */}
              <div className="relative aspect-[4/3] w-full bg-gray-100">
                <Image
                  src={p.imageUrl}
                  alt={p.caption ?? `Foto ${ano}`}
                  fill
                  className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span
                  className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/80 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-[2px] sm:text-[11px]"
                  aria-hidden
                >
                  <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Ampliar
                </span>
              </div>
            </button>
            {adminFooter ? (
              <div className="border-t border-gray-100 bg-gray-50/80 p-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:bg-white/90">
                {adminFooter(p)}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {lightbox}
    </>
  );
}
