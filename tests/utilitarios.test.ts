import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarDataEvento, proximosEventos, type Evento } from "../src/lib/agenda";
import { shareImage, shortText } from "../src/lib/seo";
import { telHref, whatsappUrl } from "../src/lib/contactos";
import { escapeHtml, normalizeEmail, consumeRateLimit, shouldAllowMutationFromOrigin } from "../src/utils/security";
import { safeRedirectPath } from "../src/lib/auth";
import type { NextRequest } from "next/server";

const ev = (data: string): Evento => ({ slug: data, titulo: "E", data, imagem: "", descricao: "" });

test("agenda: esconde eventos passados (hora de Lisboa) e ordena", () => {
  const eventos = [ev("2026-06-12"), ev("2026-05-10")];
  assert.equal(proximosEventos(eventos, new Date("2026-05-09T12:00:00Z")).length, 2);
  assert.equal(proximosEventos(eventos, new Date("2026-05-10T22:30:00Z")).length, 2, "ainda é dia 10 em Lisboa");
  assert.deepEqual(proximosEventos(eventos, new Date("2026-05-10T23:30:00Z")).map((e) => e.data), ["2026-06-12"]);
  assert.equal(proximosEventos(eventos, new Date("2026-11-14T10:00:00Z")).length, 0);
  assert.equal(formatarDataEvento("2026-05-10"), "10 de maio de 2026");
});

test("seo: textos curtos e imagens de partilha", () => {
  assert.equal(shortText("curto"), "curto");
  const longo = shortText("palavra ".repeat(40), 30);
  assert.ok(longo.length <= 31 && longo.endsWith("…"));
  assert.equal(
    shareImage("https://res.cloudinary.com/x/image/upload/v1/a.jpg"),
    "https://res.cloudinary.com/x/image/upload/c_fill,w_1200,h_630,g_auto,q_auto,f_jpg/v1/a.jpg"
  );
  assert.equal(shareImage("/local.png"), "/local.png");
  assert.equal(shareImage(null), undefined);
});

test("contactos: links de telefone e WhatsApp", () => {
  assert.equal(telHref("914 884 537"), "tel:+351914884537");
  assert.equal(telHref("+351 914 884 537"), "tel:+351914884537");
  assert.equal(whatsappUrl("351914838942"), "https://wa.me/351914838942");
  assert.equal(whatsappUrl("351914838942", "Olá & tal"), "https://wa.me/351914838942?text=Ol%C3%A1%20%26%20tal");
});

test("segurança: escape de HTML e emails", () => {
  assert.equal(escapeHtml(`<b onclick="x">'&'</b>`), "&lt;b onclick=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;");
  assert.equal(normalizeEmail("  Ana@Exemplo.PT "), "ana@exemplo.pt");
  assert.equal(normalizeEmail("sem-arroba"), null);
  assert.equal(normalizeEmail(42), null);
});

test("segurança: redirect depois do login só para caminhos internos", () => {
  assert.equal(safeRedirectPath("/perfil?x=1"), "/perfil");
  assert.equal(safeRedirectPath("//evil.com"), "/perfil");
  assert.equal(safeRedirectPath("https://evil.com"), "/perfil");
  assert.equal(safeRedirectPath(undefined), "/perfil");
});

test("segurança: rate limit em memória bloqueia depois do limite", () => {
  const key = `teste:${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(consumeRateLimit({ key, limit: 3, windowMs: 60_000 }).ok, true);
  assert.equal(consumeRateLimit({ key, limit: 3, windowMs: 60_000 }).ok, false);
});

test("segurança: pedidos de outra origem são recusados", () => {
  const req = (origin: string | null) =>
    ({
      headers: new Headers(origin ? { origin, host: "unidosdeavidos.pt" } : { host: "unidosdeavidos.pt" }),
      nextUrl: new URL("https://unidosdeavidos.pt/api/x"),
    }) as unknown as NextRequest;
  assert.equal(shouldAllowMutationFromOrigin(req("https://unidosdeavidos.pt")), true);
  assert.equal(shouldAllowMutationFromOrigin(req("https://www.unidosdeavidos.pt")), true);
  assert.equal(shouldAllowMutationFromOrigin(req("https://evil.com")), false);
  assert.equal(shouldAllowMutationFromOrigin(req(null)), true, "sem Origin (ex.: curl) passa; o cookie é SameSite=Strict");
});
