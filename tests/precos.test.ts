import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularPrecoReserva,
  emModoTudoIncluido,
  lerPrecosDoBody,
  precoBaseDaReserva,
  precoReferencia,
  type PrecosRoupa,
} from "../src/lib/aluguerRoupasPublic";

// Roupa de 2026 como ficou depois da migração.
const r2026: PrecosRoupa = {
  precoAluguer: 1600,
  precoCalcado: 200,
  precoArcos: 200,
  precoTudoIncluido: 2000,
  tudoIncluidoAte: "2027-01-01T00:00:00.000Z",
};
const r2019: PrecosRoupa = { precoAluguer: 1200, precoCalcado: 150 };
const r2013: PrecosRoupa = { precoAluguer: 800 };
const novembro2026 = new Date("2026-11-14T12:00:00Z");

test("2026 antes de 2027: preço fixo, extras incluídos (custo 0) mas guardados para o stock", () => {
  const p = calcularPrecoReserva(r2026, "2026-12-20", { calcado: true, arcos: true });
  assert.deepEqual(p, {
    tudoIncluido: true,
    precoBase: 2000,
    incluiCalcado: true,
    custoExtraCalcado: 0,
    incluiArcos: true,
    custoExtraArcos: 0,
    total: 2000,
  });
});

test("2026 a partir de 2027: base + extras opcionais", () => {
  assert.equal(calcularPrecoReserva(r2026, "2027-01-01", { calcado: false, arcos: false }).total, 1600);
  assert.equal(calcularPrecoReserva(r2026, "2027-06-10", { calcado: true, arcos: false }).total, 1800);
  assert.equal(calcularPrecoReserva(r2026, "2027-06-10", { calcado: true, arcos: true }).total, 2000);
});

test("o último dia antes da data de corte ainda é tudo incluído", () => {
  assert.equal(emModoTudoIncluido(r2026, "2026-12-31"), true);
  assert.equal(emModoTudoIncluido(r2026, "2027-01-01"), false);
});

test("sem data escolhida decide pela data de hoje", () => {
  assert.equal(emModoTudoIncluido(r2026, "", novembro2026), true);
  assert.equal(emModoTudoIncluido(r2026, "", new Date("2027-02-01T12:00:00Z")), false);
  assert.equal(precoReferencia(r2026, novembro2026), 2000);
  assert.equal(precoReferencia(r2026, new Date("2027-02-01T12:00:00Z")), 1600);
});

test("extras que a roupa não tem são ignorados", () => {
  const p = calcularPrecoReserva(r2013, "2027-05-01", { calcado: true, arcos: true });
  assert.equal(p.incluiCalcado, false);
  assert.equal(p.incluiArcos, false);
  assert.equal(p.total, 800);
  assert.equal(calcularPrecoReserva(r2019, "2027-05-01", { calcado: true, arcos: true }).total, 1350);
});

test("reservas antigas usam o preço guardado, não o atual da roupa", () => {
  assert.equal(precoBaseDaReserva({ precoBase: 2000, roupa: { precoAluguer: 1600 } }), 2000);
  assert.equal(precoBaseDaReserva({ precoBase: null, roupa: { precoAluguer: 1600 } }), 1600);
});

test("lerPrecosDoBody: valida e converte o que vem do admin", () => {
  assert.deepEqual(lerPrecosDoBody({ precoAluguer: "1500", precoCalcado: "", arcosDisponiveis: "10.7" }), {
    data: { precoAluguer: 1500, precoCalcado: null, arcosDisponiveis: 10 },
  });
  const d = lerPrecosDoBody({ tudoIncluidoAte: "2027-01-01" });
  assert.ok("data" in d && d.data.tudoIncluidoAte instanceof Date);
  assert.ok("error" in lerPrecosDoBody({ precoAluguer: "-5" }));
  assert.ok("error" in lerPrecosDoBody({ precoCalcado: "abc" }));
  assert.ok("error" in lerPrecosDoBody({ tudoIncluidoAte: "amanhã" }));
  assert.deepEqual(lerPrecosDoBody({}), { data: {} }, "campos ausentes não mexem em nada");
});
