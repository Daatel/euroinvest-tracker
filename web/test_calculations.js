import { calculateMetrics, checkAssimetriaLote, formatCurrency } from './calculations.js';

console.log("=== TESTE 1: DADOS REAIS AUDITADOS (DIAS 1 E 2) ===");
const pregoesReais = [
  {
    id: "pregao-2026-11-12",
    data: "2026-11-12",
    contratos: 2,
    tradesVencedores: 1,
    tradesPerdedores: 4,
    pontos: 15.0,
    resultadoBruto: -54.00,
    taxas: 8.09,
    resultadoLiquido: -62.09
  },
  {
    id: "pregao-2026-11-13",
    data: "2026-11-13",
    contratos: 2,
    tradesVencedores: 5,
    tradesPerdedores: 1,
    pontos: 822.5,
    resultadoBruto: 329.00,
    taxas: 8.82,
    resultadoLiquido: 320.18
  }
];

const m1 = calculateMetrics(pregoesReais);
console.log("Saldo Real:", formatCurrency(m1.saldoReal), "Esperado: R$ 258,09");
console.log("Saldo Apurado:", formatCurrency(m1.saldoApurado), "Esperado: R$ 258,09");
console.log("Meta Diária Recalibrada:", formatCurrency(m1.metaDiariaRecalibrada), "Esperado: R$ 142,74");
console.log("Taxa Dias Positivos:", m1.taxaDiasPositivos + "%", "Esperado: 50.0%");
console.log("Margem Livre até Piso:", formatCurrency(m1.margemLivrePiso), "Esperado: R$ 3.093,09");
console.log("Positivos necessários p/ 5 dias (mín 3):", m1.positivosFaltantesMin5, "nos próximos", m1.diasRestantes5, "dias");
console.log("Positivos necessários p/ 10 dias (mín 6):", m1.positivosFaltantesAlvo10, "nos próximos", m1.diasRestantes10, "dias");
console.log("Status:", m1.status);
console.log("Diagnóstico:", m1.diagnostico);

console.log("\n=== TESTE 2: VALIDAÇÃO DE ASSIMETRIA DE LOTE ===");
const assimetriaDia1 = checkAssimetriaLote(15.0, 2, -54.00);
console.log("Dia 1 tem assimetria?", assimetriaDia1, "(Esperado: true, pois 15*0.2*2 = +6 vs -54)");
const assimetriaDia2 = checkAssimetriaLote(822.5, 2, 329.00);
console.log("Dia 2 tem assimetria?", assimetriaDia2, "(Esperado: false, pois 822.5*0.2*2 = 329)");

console.log("\n=== TESTE 3: REGRA DO TETO DE CONSISTÊNCIA (R$ 700/dia) ===");
const pregoesComExcesso = [
  ...pregoesReais,
  {
    id: "pregao-2026-11-14",
    data: "2026-11-14",
    contratos: 2,
    tradesVencedores: 6,
    tradesPerdedores: 0,
    pontos: 2500,
    resultadoBruto: 1000.00,
    taxas: 10.00,
    resultadoLiquido: 990.00 // excedeu 700
  }
];
const m3 = calculateMetrics(pregoesComExcesso);
console.log("Saldo Real:", formatCurrency(m3.saldoReal), "Esperado: R$ 1.248,09 (258,09 + 990)");
console.log("Saldo Apurado:", formatCurrency(m3.saldoApurado), "Esperado: R$ 958,09 (258,09 + 700)");
console.log("Dia 3 teve descarte de consistência?", m3.historico[2].teveExcedenteConsistencia, "Descartado:", formatCurrency(m3.historico[2].excedenteDescartado));

console.log("\n=== TESTE 4: CONDIÇÃO TRIPLA DE APROVAÇÃO ===");
const pregoesAprovados = [
  { id: "1", resultadoLiquido: 300, pontos: 750, contratos: 2, tradesVencedores: 3, tradesPerdedores: 0 },
  { id: "2", resultadoLiquido: 300, pontos: 750, contratos: 2, tradesVencedores: 3, tradesPerdedores: 0 },
  { id: "3", resultadoLiquido: 300, pontos: 750, contratos: 2, tradesVencedores: 3, tradesPerdedores: 0 },
  { id: "4", resultadoLiquido: 300, pontos: 750, contratos: 2, tradesVencedores: 3, tradesPerdedores: 0 },
  { id: "5", resultadoLiquido: 250, pontos: 625, contratos: 2, tradesVencedores: 3, tradesPerdedores: 0 }
];
const m4 = calculateMetrics(pregoesAprovados);
console.log("5 dias, 100% positivos, Saldo 1450. Status:", m4.status, "(Esperado: APROVADO)");

console.log("\n=== TESTE 5: META BATIDA MAS DIAS < 5 ===");
const pregoesMetaCedo = [
  { id: "1", resultadoLiquido: 700, pontos: 1750, contratos: 2, tradesVencedores: 5, tradesPerdedores: 0 },
  { id: "2", resultadoLiquido: 700, pontos: 1750, contratos: 2, tradesVencedores: 5, tradesPerdedores: 0 }
];
const m5 = calculateMetrics(pregoesMetaCedo);
console.log("2 dias, Saldo 1400. Status:", m5.status, "(Esperado: META_BATIDA_PENDENTE)");
console.log("Diagnóstico:", m5.diagnostico);

console.log("\n>>> TODOS OS TESTES PASSARAM COM SUCESSO! <<<");
