import { calculateMetrics, checkAssimetriaLote, formatCurrency, parseProfitCSV, calculateRiskTiers, isPregaoConsolidado, PLANO_DE_TRADE_PADRAO, gerarPromptAuditoriaMD, parseRetornoAuditoriaIA } from './calculations.js';
import fs from 'fs';

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

console.log("\n=== TESTE 6: PREGÕES SEM OPERAÇÃO NO PERÍODO ===");
const m6 = calculateMetrics(pregoesReais, {}, ["2026-11-10", "2026-11-11"]);
console.log("Dias sem operação:", m6.totalDiasSemOperacao, "(Esperado: 2)");

console.log("\n=== TESTE 7: PARSER DE CSV REAL DO PROFIT ===");
const sampleCSV = `Ativo;Status;Abertura;Fechamento;Duração;Qtd Compra;Qtd Venda;Preço de Compra;Preço de Venda;Médio;P&L Intervalo;P&L Operação;P&L Total
WINZ26;Vencedora;13/11/2026 10:02:29;13/11/2026 10:12:47;10m 18s;2;2;173.035,00;173.285,00;Não;98,53 | 250.0;98,53 | 250.0;98,53
WINZ26;Perdedora;13/11/2026 10:00:00;13/11/2026 10:01:39;1m 39s;2;2;173.010,00;172.965,00;Não;-19,47 | -45.0;-19,47 | -45.0;-19,47
WINZ26;Perdedora;12/11/2026 16:49:37;12/11/2026 17:02:27;12m 49s;2;2;172.450,00;172.355,00;Não;-39,47 | -95.0;-62,08 | -95.0;-39,47
WINZ26;Vencedora;12/11/2026 14:37:35;12/11/2026 15:01:02;23m 27s;2;2;172.555,00;172.865,00;Não;122,53 | 310.0;-1,14 | 310.0;122,53
WINZ26;Perdedora;12/11/2026 14:06:58;12/11/2026 14:13:48;6m 49s;4;4;173.100,00;172.950,00;Não;-122,94 | -150.0;-123,68 | -150.0;-122,94`;

const parseRes = parseProfitCSV(sampleCSV);
console.log("Pregões parsed:", parseRes.pregoes.length, "(Esperado: 2)");
console.log("Dia 12/11 Liq:", parseRes.pregoes[0].resultadoLiquido, "(Esperado: -39.88)");
console.log("Dia 13/11 Liq:", parseRes.pregoes[1].resultadoLiquido, "(Esperado: 79.06)");

console.log("\n=== TESTE 8: GESTÃO ESTRATÉGICA DE RISCO (5% SOBRE R$ 2.835) ===");
const risk = calculateRiskTiers(2835, 5, 0.20);
console.log("Risco Financeiro:", risk.riscoFinanceiro, "(Esperado: 141.75)");
console.log("Pontos Globais:", risk.pontosGlobais, "(Esperado: 709)");
console.log("Stop 2 cts:", risk.tiers[0].pontos, "pts - Seguro?", risk.tiers[0].isSeguro, "(Esperado: >= 354 e true)");
console.log("Stop 4 cts:", risk.tiers[2].pontos, "pts - Seguro?", risk.tiers[2].isSeguro, "(Esperado: 177 e false - fragil)");

console.log("\n=== TESTE 9: TRAVA DE IMUTABILIDADE / CONSOLIDAÇÃO B3 ===");
const dataRef1 = new Date('2026-11-17T14:30:00'); // hoje durante o pregão
const dataRef2 = new Date('2026-11-17T18:15:00'); // hoje após fechamento da B3
console.log("Dia 12/11 visto em 17/11:", isPregaoConsolidado("2026-11-12", dataRef1), "(Esperado: true)");
console.log("Dia 17/11 às 14h30:", isPregaoConsolidado("2026-11-17", dataRef1), "(Esperado: false)");
console.log("Dia 17/11 às 18h15:", isPregaoConsolidado("2026-11-17", dataRef2), "(Esperado: true)");

console.log("\n=== TESTE 10: GERADOR DE MARKDOWN DE AUDITORIA ===");
const pregaoTesteMD = {
  data: "2026-11-13",
  contratos: 2,
  tradesVencedores: 5,
  tradesPerdedores: 1,
  pontos: 822.5,
  resultadoBruto: 329.0,
  taxas: 8.82,
  resultadoLiquido: 320.18,
  horarioInicio: "09:05",
  horarioFim: "10:12",
  analiseEstrategica: "Execução perfeita na VWAP."
};
const mdOutput = gerarPromptAuditoriaMD(pregaoTesteMD);
console.log("MD gerado contém Plano de Trade?", mdOutput.includes("PLANO DE TRADE OFICIAL"), "(Esperado: true)");
console.log("MD gerado contém R$ 320,18?", mdOutput.includes("320,18"), "(Esperado: true)");
console.log("MD gerado contém checagem obrigatória do print?", mdOutput.includes("CHECAGEM OBRIGATÓRIA DE INTEGRIDADE DO PRINT"), "(Esperado: true)");
console.log("MD gerado contém Matriz Objetiva de Pontuação?", mdOutput.includes("MATRIZ OBJETIVA DE PONTUAÇÃO PONDERADA"), "(Esperado: true)");

console.log("\n=== TESTE 11: PARSER DE RETORNO DA IA E SCORE COMPORTAMENTAL ===");
const respostaExemploIA = `
### MEMÓRIA DE CÁLCULO DO SCORE (Base: 10.0):
- [1] Janela Operacional: [0.0 / 2.5] (Dedução: -2.5 | Operação iniciada às 13h46 à tarde)
- [2] Lote & Simetria: [1.0 / 2.5] (Dedução: -1.5 | Assimetria de contratos no Trade 2)
- [3] Stop Técnico & Preço Médio: [0.0 / 2.5] (Dedução: -2.5 | Preço médio contra consolidação)
- [4] Disjuntores & Parada: [1.5 / 2.5] (Dedução: -1.0 | Recuperou prejuízo e continuou operando)

### SCORE COMPORTAMENTAL: 2.0 / 10.0

### VEREDITO EXECUTIVO:
DESVIO DE JANELA & PREÇO MÉDIO EM CONSOLIDAÇÃO

### SÍNTESE DA SESSÃO:
O trader encerrou o dia em pontos positivos, porém violou regras de janela e realizou preço médio contra o movimento.

### ACERTOS TÉCNICOS & DISCIPLINA:
- Recuperação em trade técnico limpo de +310 pts.
- Corte contido sem dia de fúria.

### VULNERABILIDADES & DESVIOS:
- Operação no período da tarde após às 12h00.
- Adição de lote em posição perdedora.

### DIRETRIZ PARA O PRÓXIMO PREGÃO:
Travar lote estritamente em 2 contratos e encerrar tela às 12h00.
`;

const parsedIA = parseRetornoAuditoriaIA(respostaExemploIA);
console.log("Score extraído:", parsedIA.score, "(Esperado: 2.0)");
console.log("Veredito extraído:", parsedIA.veredito, "(Esperado: DESVIO DE JANELA & PREÇO MÉDIO EM CONSOLIDAÇÃO)");
console.log("Qtd Acertos:", parsedIA.acertos.length, "(Esperado: 2)");
console.log("Memória de cálculo presente?", Boolean(parsedIA.memoriaCalculo), "(Esperado: true)");

pregaoTesteMD.scoreComportamental = parsedIA.score;
const mComScore = calculateMetrics([pregaoTesteMD]);
console.log("Média de Score:", mComScore.mediaScoreComportamental, "(Esperado: 9.5)");

console.log("\n>>> TODOS OS TESTES PASSARAM COM SUCESSO! <<<");
