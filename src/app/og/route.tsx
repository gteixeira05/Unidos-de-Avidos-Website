import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Imagem de partilha (WhatsApp, Facebook…): foto do hero com o título da página por cima.
// Uso: /og?title=Galeria
let bgDataUrl: string | null = null;

export async function GET(req: Request) {
  const title = (new URL(req.url).searchParams.get("title") || "Unidos de Avidos").slice(0, 90);

  if (!bgDataUrl) {
    const buf = await readFile(path.join(process.cwd(), "public", "og-bg.jpg"));
    bgDataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgDataUrl} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0 }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            padding: "120px 64px 48px",
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.85))",
            color: "white",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          <div style={{ marginTop: 16, fontSize: 30, color: "#4ade80" }}>Unidos de Avidos</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" },
    }
  );
}
