/**
 * calculations.js — Motor de Cálculos e Regras de Negócio da Mesa Euroinvest
 * 
 * Opera com aritmética de precisão em centavos (inteiros) para evitar erros de ponto flutuante.
 */

export const CONFIG = {
  META_FINANCEIRA: 1400.00,       // Teto de aprovação líquida (R$)
  PISO_DRAWDOWN: -2835.00,        // Perda máxima total tolerada (R$)
  TETO_CONSISTENCIA_DIA: 700.00,  // 50% da meta — excedente diário é desconsiderado
  MAX_PREGOES: 10,                // Prazo máximo planejado
  MIN_PREGOES: 5,                 // Mínimo regulamentar de dias operados
  MIN_TAXA_POSITIVOS: 60.0,       // Mínimo de 60% de dias positivos para aprovação
  VALOR_POR_PONTO_WIN: 0.20       // R$ 0,20 por ponto/contrato no Mini Índice
};

/**
 * Converte valor em reais (float) para centavos inteiros
 */
export function toCents(value) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(Number(value) * 100);
}

/**
 * Converte centavos inteiros para reais (float)
 */
export function fromCents(cents) {
  return Number(cents) / 100;
}

/**
 * Formata valor em moeda brasileira (BRL)
 */
export function formatCurrency(value, showSign = false) {
  const num = typeof value === 'number' ? value : fromCents(value);
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(num));

  if (num < 0) return `- ${formatted}`;
  if (showSign && num > 0) return `+ ${formatted}`;
  return formatted;
}

/**
 * Formata percentual
 */
export function formatPercent(value) {
  return `${Number(value).toFixed(1).replace('.', ',')}%`;
}

/**
 * Validação de Assimetria de Lote no pregão
 * Retorna true se houver discrepância significativa entre pontos * 0.20 * contratos e o bruto
 */
export function checkAssimetriaLote(pontos, contratos, bruto, valorPonto = CONFIG.VALOR_POR_PONTO_WIN) {
  if (!pontos || !contratos || bruto === undefined || bruto === null) return false;
  const estimado = Number(pontos) * valorPonto * Number(contratos);
  return Math.abs(estimado - Number(bruto)) > 2.00;
}

/**
 * Motor central de cálculo estatístico e regulamentar
 * @param {Array} pregoes Lista de objetos de pregões
 * @param {Object} customConfig Sobrescrita de configurações vindas do JSON ou UI
 * @param {Array} diasSemOperacao Lista de datas de dias sem operação identificados
 */
export function calculateMetrics(pregoes = [], customConfig = {}, diasSemOperacao = []) {
  // Normaliza chaves vindas de customConfig ou JSON meta
  const cfg = {
    META_FINANCEIRA: customConfig.metaFinanceira ?? customConfig.META_FINANCEIRA ?? CONFIG.META_FINANCEIRA,
    PISO_DRAWDOWN: customConfig.pisoDrawdown ?? customConfig.PISO_DRAWDOWN ?? CONFIG.PISO_DRAWDOWN,
    TETO_CONSISTENCIA_DIA: customConfig.tetoConsistenciaDiaria ?? customConfig.TETO_CONSISTENCIA_DIA ?? CONFIG.TETO_CONSISTENCIA_DIA,
    MAX_PREGOES: customConfig.maxPregões ?? customConfig.maxPregoes ?? customConfig.MAX_PREGOES ?? CONFIG.MAX_PREGOES,
    MIN_PREGOES: customConfig.minPregões ?? customConfig.minPregoes ?? customConfig.MIN_PREGOES ?? CONFIG.MIN_PREGOES,
    MIN_TAXA_POSITIVOS: customConfig.minTaxaDiasPositivos ?? customConfig.MIN_TAXA_POSITIVOS ?? CONFIG.MIN_TAXA_POSITIVOS,
    VALOR_POR_PONTO_WIN: customConfig.valorPorPontoContrato ?? customConfig.VALOR_POR_PONTO_WIN ?? CONFIG.VALOR_POR_PONTO_WIN
  };

  const diasSemOpList = Array.isArray(diasSemOperacao) && diasSemOperacao.length > 0 
    ? diasSemOperacao 
    : (Array.isArray(customConfig.diasSemOperacao) ? customConfig.diasSemOperacao : []);
  const totalDiasSemOperacao = diasSemOpList.length;
  
  const total = pregoes.length;
  let saldoRealCents = 0;
  let saldoApuradoCents = 0;
  let diasPositivos = 0;
  let diasNegativos = 0;
  let diasZero = 0;
  let totalTradesGanhos = 0;
  let totalTradesPerdidos = 0;
  let totalPontos = 0;
  let totalBrutoCents = 0;
  let totalTaxasCents = 0;

  const tetoCents = toCents(cfg.TETO_CONSISTENCIA_DIA);

  // Processa pregão a pregão mantendo o histórico progressivo
  const historicoComProgressao = pregoes.map((dia, index) => {
    const liquidoCents = toCents(dia.resultadoLiquido);
    const brutoCents = toCents(dia.resultadoBruto);
    const taxasCents = toCents(dia.taxas);

    totalBrutoCents += brutoCents;
    totalTaxasCents += taxasCents;
    totalPontos += Number(dia.pontos || 0);
    totalTradesGanhos += Number(dia.tradesVencedores || 0);
    totalTradesPerdidos += Number(dia.tradesPerdedores || 0);

    // Saldo real do dia
    saldoRealCents += liquidoCents;

    // Regra de consistência: teto de R$ 700 no ganho
    let apuradoDiaCents = liquidoCents;
    let teveExcedenteConsistencia = false;
    let excedenteCents = 0;

    if (liquidoCents > tetoCents) {
      apuradoDiaCents = tetoCents;
      teveExcedenteConsistencia = true;
      excedenteCents = liquidoCents - tetoCents;
    }

    saldoApuradoCents += apuradoDiaCents;

    if (liquidoCents > 0) diasPositivos++;
    else if (liquidoCents < 0) diasNegativos++;
    else diasZero++;

    const pregoesAteAqui = index + 1;
    const taxaPositivosAteAqui = (diasPositivos / pregoesAteAqui) * 100;

    return {
      ...dia,
      pregaoNumero: pregoesAteAqui,
      saldoRealAcumulado: fromCents(saldoRealCents),
      saldoApuradoAcumulado: fromCents(saldoApuradoCents),
      taxaDiasPositivosAcumulada: Number(taxaPositivosAteAqui.toFixed(1)),
      teveExcedenteConsistencia,
      excedenteDescartado: fromCents(excedenteCents)
    };
  });

  const saldoReal = fromCents(saldoRealCents);
  const saldoApurado = fromCents(saldoApuradoCents);
  const taxaDiasPositivos = total > 0 ? Number(((diasPositivos / total) * 100).toFixed(1)) : 0;
  
  const diasRestantes10 = Math.max(0, cfg.MAX_PREGOES - total);
  const diasRestantes5 = Math.max(0, cfg.MIN_PREGOES - total);

  // Recálculo da Meta Diária baseada no SALDO APURADO
  const faltaParaMeta = Math.max(0, cfg.META_FINANCEIRA - saldoApurado);
  let metaDiariaRecalibrada = 0;
  let metaInviavelConsistencia = false;

  if (faltaParaMeta > 0) {
    const divisor = Math.max(1, diasRestantes10);
    metaDiariaRecalibrada = Number((faltaParaMeta / divisor).toFixed(2));
    if (metaDiariaRecalibrada > cfg.TETO_CONSISTENCIA_DIA) {
      metaInviavelConsistencia = true;
    }
  }

  // Margem Livre até o Piso (R$ 2.835,00)
  const margemLivrePiso = Number((saldoReal - cfg.PISO_DRAWDOWN).toFixed(2));
  const percentualDrawdownUsado = Math.min(100, Math.max(0, ((-Math.min(0, saldoReal)) / Math.abs(cfg.PISO_DRAWDOWN)) * 100));

  // Cálculo dos dias positivos necessários:
  // 1. Para fechar no mínimo de 5 dias com >= 60% (precisa de pelo menos 3 positivos de 5)
  const positivosFaltantesMin5 = Math.max(0, 3 - diasPositivos);
  // 2. Para fechar em 10 dias com >= 60% (precisa de pelo menos 6 positivos de 10)
  const positivosFaltantesAlvo10 = Math.max(0, 6 - diasPositivos);

  // Status Triplo de Aprovação
  let status = 'EM_ANDAMENTO';
  let badgeColor = 'bg-blue-900/50 text-blue-300 border-blue-700';
  let diagnostico = '';

  const bateuMetaFinanceira = saldoApurado >= cfg.META_FINANCEIRA;
  const cumpriuMinDias = total >= cfg.MIN_PREGOES;
  const cumpriuTaxaPositivos = taxaDiasPositivos >= cfg.MIN_TAXA_POSITIVOS;
  const rompeuPiso = saldoReal <= cfg.PISO_DRAWDOWN;
  const estourouPrazo = total >= cfg.MAX_PREGOES;

  if (rompeuPiso) {
    status = 'REPROVADO_PISO';
    badgeColor = 'bg-red-950/80 text-red-400 border-red-800';
    diagnostico = `Limite de perda atingido (${formatCurrency(saldoReal)}). Limite máximo é ${formatCurrency(cfg.PISO_DRAWDOWN)}.`;
  } else if (bateuMetaFinanceira && cumpriuMinDias && cumpriuTaxaPositivos) {
    status = 'APROVADO';
    badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-600';
    diagnostico = `PARABÉNS! As 3 condições foram alcançadas: Saldo Apurado (${formatCurrency(saldoApurado)}), ${total} pregões operados e ${formatPercent(taxaDiasPositivos)} de dias positivos. Interrompa as operações e aguarde validação do suporte.`;
  } else if (bateuMetaFinanceira) {
    status = 'META_BATIDA_PENDENTE';
    badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-600';
    const pendencias = [];
    if (!cumpriuMinDias) pendencias.push(`faltam ${cfg.MIN_PREGOES - total} pregão(ões) para o mínimo de ${cfg.MIN_PREGOES}`);
    if (!cumpriuTaxaPositivos) pendencias.push(`taxa de positivos (${formatPercent(taxaDiasPositivos)}) abaixo de ${cfg.MIN_TAXA_POSITIVOS}%`);
    diagnostico = `Meta financeira atingida (${formatCurrency(saldoApurado)}), porém ${pendencias.join(' e ')}. Continue operando com mão mínima para cumprir o regulamento.`;
  } else if (estourouPrazo) {
    status = 'PRAZO_ESGOTADO';
    badgeColor = 'bg-orange-950/80 text-orange-400 border-orange-700';
    diagnostico = `10 pregões atingidos sem cumprir todas as condições. Saldo atual: ${formatCurrency(saldoApurado)}.`;
  } else if (total === 0) {
    status = 'AGUARDANDO_DADOS';
    badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
    diagnostico = `Nenhum pregão registrado ainda. Clique em "Restaurar" para carregar seu arquivo de backup (dados_avaliacao.json) ou use o formulário para registrar o pregão de hoje.`;
  } else {
    status = 'EM_ANDAMENTO';
    badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
    diagnostico = `Avaliação ativa: Pregão ${total} de ${cfg.MAX_PREGOES}. Faltam ${formatCurrency(faltaParaMeta)} e você precisa de ${positivosFaltantesAlvo10} dia(s) positivo(s) nos próximos ${diasRestantes10} pregões.`;
  }

  // Estatísticas operacionais adicionais
  const totalTrades = totalTradesGanhos + totalTradesPerdidos;
  const taxaAcertoTrades = totalTrades > 0 ? Number(((totalTradesGanhos / totalTrades) * 100).toFixed(1)) : 0;

  return {
    config: cfg,
    totalPregoes: total,
    diasPositivos,
    diasNegativos,
    diasZero,
    saldoReal,
    saldoApurado,
    faltaParaMeta,
    metaDiariaRecalibrada,
    metaInviavelConsistencia,
    taxaDiasPositivos,
    cumpriuTaxaPositivos,
    cumpriuMinDias,
    bateuMetaFinanceira,
    margemLivrePiso,
    percentualDrawdownUsado,
    diasRestantes10,
    diasRestantes5,
    positivosFaltantesMin5,
    positivosFaltantesAlvo10,
    status,
    badgeColor,
    diagnostico,
    totalTrades,
    totalTradesGanhos,
    totalTradesPerdidos,
    taxaAcertoTrades,
    totalPontos,
    totalBruto: fromCents(totalBrutoCents),
    totalTaxas: fromCents(totalTaxasCents),
    totalDiasSemOperacao,
    diasSemOperacao: diasSemOpList,
    historico: historicoComProgressao
  };
}

/**
 * Parser de Relatório CSV de Operações (Nelogica / Profit)
 * Lê os trades intradia, agrupa por pregão e identifica dias úteis sem operação no período
 * @param {string} csvText Conteúdo bruto do arquivo CSV
 * @returns {Object} { pregoes: Array, diasSemOperacao: Array, totalTrades: number }
 */
export function parseProfitCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return null;

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(delimiter).map(h => h.trim());
  
  const pnlIntervaloIndex = header.findIndex(h => h.includes('P&L Intervalo'));
  const pnlTotIndex = header.findIndex(h => h.includes('P&L Total'));
  const aberturaIndex = header.findIndex(h => h.includes('Abertura'));
  const statusIndex = header.findIndex(h => h.includes('Status'));
  const qtdIndex = header.findIndex(h => h.includes('Qtd Compra') || h.includes('Qtd Venda'));

  const pnlIndex = pnlIntervaloIndex !== -1 ? pnlIntervaloIndex : pnlTotIndex;
  if (aberturaIndex === -1 || pnlIndex === -1) return null;

  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length < 4) continue;
    const aberturaRaw = cols[aberturaIndex] || '';
    const [d] = aberturaRaw.split(' ');
    if (!d || !d.includes('/')) continue;
    
    const [dia, mes, ano] = d.split('/');
    const dateIso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

    const status = cols[statusIndex] || '';
    const qtd = parseInt(cols[qtdIndex], 10) || 2;
    const pnlRaw = cols[pnlIndex] || '0';
    let liquido = 0;
    let pontos = 0;

    if (pnlRaw.includes('|')) {
      const parts = pnlRaw.split('|');
      liquido = parseFloat(parts[0].replace(/\./g, '').replace(',', '.').trim()) || 0;
      pontos = parseFloat(parts[1].trim()) || 0;
    } else {
      liquido = parseFloat(pnlRaw.replace(/\./g, '').replace(',', '.').trim()) || 0;
    }

    const valorPontoWin = CONFIG.VALOR_POR_PONTO_WIN;
    const bruto = Math.round(pontos * valorPontoWin * qtd * 100) / 100;
    const taxas = Math.round(Math.max(0, bruto - liquido) * 100) / 100;

    trades.push({ dateIso, status, qtd, pontos, bruto, taxas, liquido });
  }

  if (trades.length === 0) return { pregoes: [], diasSemOperacao: [], totalTrades: 0 };

  // Agrupa trades por data
  const diasMap = {};
  for (const t of trades) {
    if (!diasMap[t.dateIso]) {
      diasMap[t.dateIso] = {
        data: t.dateIso,
        pontos: 0,
        resultadoBruto: 0,
        taxas: 0,
        resultadoLiquido: 0,
        tradesVencedores: 0,
        tradesPerdedores: 0,
        maxContratos: 0
      };
    }
    const d = diasMap[t.dateIso];
    d.pontos += t.pontos;
    d.resultadoBruto += t.bruto;
    d.taxas += t.taxas;
    d.resultadoLiquido += t.liquido;
    if (t.status.toLowerCase().includes('venc')) d.tradesVencedores++;
    else if (t.status.toLowerCase().includes('perd')) d.tradesPerdedores++;
    d.maxContratos = Math.max(d.maxContratos, t.qtd);
  }

  const sortedDates = Object.keys(diasMap).sort();
  const minDate = new Date(`${sortedDates[0]}T00:00:00`);
  const maxDate = new Date(`${sortedDates[sortedDates.length - 1]}T00:00:00`);

  // Detecta dias úteis no período sem trades (assumidos diretamente como sem operação)
  const diasSemOperacao = [];
  const cur = new Date(minDate);
  while (cur <= maxDate) {
    const dayOfWeek = cur.getDay(); // 0 = Dom, 6 = Sab
    const iso = cur.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (!diasMap[iso]) {
        diasSemOperacao.push(iso);
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  const pregoes = sortedDates.map((dateIso) => {
    const d = diasMap[dateIso];
    return {
      data: d.data,
      contratos: d.maxContratos || 2,
      pontos: Math.round(d.pontos * 10) / 10,
      resultadoBruto: Math.round(d.resultadoBruto * 100) / 100,
      taxas: Math.round(d.taxas * 100) / 100,
      resultadoLiquido: Math.round(d.resultadoLiquido * 100) / 100,
      tradesVencedores: d.tradesVencedores,
      tradesPerdedores: d.tradesPerdedores
    };
  });

  return { pregoes, diasSemOperacao, totalTrades: trades.length };
}
