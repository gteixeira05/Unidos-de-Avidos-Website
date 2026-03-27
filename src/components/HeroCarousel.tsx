"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const IMAGENS = ["/hero-1.png", "/hero-2.png", "/hero-3.png", "/hero-4.png"];

export default function HeroCarousel() {
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % IMAGENS.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <section className="relative -mt-24 h-[60vh] min-h-[420px] overflow-hidden pt-24">
      {/* Slides */}
      {IMAGENS.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === indiceAtual ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt="Marchas Antoninas - Unidos de Avidos"
            fill
            sizes="100vw"
            quality={90}
            priority={index === 0}
            className="object-cover object-center"
          />
          {/* Overlay escuro para melhorar a leitura do texto */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>
      ))}

      {/* Título sobre a foto (centralizado) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center px-4 pt-28 text-white sm:pt-32 md:pt-36">
        <h1 className="text-center text-4xl font-bold tracking-tight drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl">
          Unidos de Avidos
        </h1>
      </div>

      {/* Indicadores */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
        {IMAGENS.map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === indiceAtual ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

