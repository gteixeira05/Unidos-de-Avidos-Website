import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarDuracao, urlCapaVideo, urlVideoOtimizado } from "../src/lib/media/video-urls";

const original = "https://res.cloudinary.com/demo/video/upload/v1700000000/unidos-avidos/roupas/abc/videos/xyz.mov";

test("vídeos: versão otimizada em MP4 H.264, lado maior até 1280 px", () => {
  assert.equal(
    urlVideoOtimizado(original),
    "https://res.cloudinary.com/demo/video/upload/vc_h264,q_auto,w_1280,h_1280,c_limit/v1700000000/unidos-avidos/roupas/abc/videos/xyz.mp4"
  );
});

test("vídeos: capa é um JPG do 1.º segundo", () => {
  assert.equal(
    urlCapaVideo(original),
    "https://res.cloudinary.com/demo/video/upload/so_1,w_1280,h_1280,c_limit,q_auto/v1700000000/unidos-avidos/roupas/abc/videos/xyz.jpg"
  );
});

test("vídeos: URLs que não são do Cloudinary ficam iguais", () => {
  assert.equal(urlVideoOtimizado("/local.mp4"), "/local.mp4");
});

test("vídeos: duração em m:ss", () => {
  assert.equal(formatarDuracao(75.4), "1:15");
  assert.equal(formatarDuracao(9), "0:09");
  assert.equal(formatarDuracao(null), "");
});
