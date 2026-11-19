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
 * Verifica se um pregão está consolidado (fechamento oficial da B3)
 * Um pregão é consolidado se for de data anterior à data de referência (hoje),
 * ou se for do dia de hoje após o encerramento oficial da B3 (18:00).
 * @param {string} dataIso Data no formato YYYY-MM-DD
 * @param {Date} dataReferencia Objeto Date de referência (padrão: agora)
 * @returns {boolean}
 */
export function isPregaoConsolidado(dataIso, dataReferencia = new Date()) {
  if (!dataIso) return false;
  const anoRef = dataReferencia.getFullYear();
  const mesRef = String(dataReferencia.getMonth() + 1).padStart(2, '0');
  const diaRef = String(dataReferencia.getDate()).padStart(2, '0');
  const hojeStr = `${anoRef}-${mesRef}-${diaRef}`;

  if (dataIso < hojeStr) return true;
  if (dataIso === hojeStr && dataReferencia.getHours() >= 18) return true;
  return false;
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

  // Média de Disciplina / Score Comportamental (0 a 10)
  const scoresValidos = pregoes
    .map(p => Number(p.scoreComportamental))
    .filter(s => !isNaN(s) && s > 0);
  const mediaScoreComportamental = scoresValidos.length > 0
    ? Number((scoresValidos.reduce((acc, val) => acc + val, 0) / scoresValidos.length).toFixed(1))
    : null;

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
    mediaScoreComportamental,
    totalScoresAvaliados: scoresValidos.length,
    historico: historicoComProgressao
  };
}

/**
 * Parser de Relatório CSV de Operações (Nelogica / Profit)
 * Lê os trades intradia, agrupa por pregão e identifica dias úteis sem operação no período
 * @param {string} csvText Conteúdo bruto do arquivo CSV
 * @returns {Object} { pregoes: Array, diasSemOperacao: Array, totalTrades: number }
 */
/**
 * Parser Universal de Relatórios de Trading (RocketTrader, Profit, Nelogica, Tryd, etc.)
 * Resiliente a variações de nomenclatura de colunas, delimitadores (; , \t) e formatos de valores.
 * @param {string} csvText Texto bruto do arquivo de exportação
 * @returns {Object|null}
 */
export function parseProfitCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return null;

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');
  
  function norm(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/["']/g, '')
      .trim();
  }

  const rawHeader = firstLine.split(delimiter).map(h => h.replace(/["']/g, '').trim());
  const normHeader = rawHeader.map(norm);

  // Busca inteligente de colunas por múltiplos sinônimos
  const pnlIndex = normHeader.findIndex(h => 
    h === 'p&l total' || h === 'p&l operacao' || h === 'p&l intervalo' || h.includes('p&l') || 
    h.includes('resultado liquido') || h.includes('liquido') || h.includes('lucro') || h.includes('profit')
  );
  
  const aberturaIndex = normHeader.findIndex(h => 
    h.includes('abertura') || h === 'data' || h.includes('data/hora') || h.includes('inicio') || 
    h.includes('horario') || h.includes('open') || h.includes('date')
  );

  const statusIndex = normHeader.findIndex(h => 
    h.includes('status') || h === 'tipo' || h.includes('resultado') || h.includes('win')
  );

  const qtdIndex = normHeader.findIndex(h => 
    h.includes('qtd c') || h.includes('qtd v') || h.includes('qtd compra') || h.includes('qtd venda') || 
    h.includes('qtd') || h.includes('quantidade') || h.includes('contratos') || h.includes('lote') || 
    h.includes('volume') || h.includes('qty') || h.includes('size')
  );

  const precoCIndex = normHeader.findIndex(h => 
    h.includes('preco c') || h.includes('preco compra') || h.includes('preco de compra') || 
    h.includes('preco entrada') || h.includes('entrada') || h.includes('buy')
  );

  const precoVIndex = normHeader.findIndex(h => 
    h.includes('preco v') || h.includes('preco venda') || h.includes('preco de venda') || 
    h.includes('preco saida') || h.includes('saida') || h.includes('sell')
  );

  const pontosIndex = normHeader.findIndex(h => 
    h.includes('pontos') || h === 'pts' || h.includes('variacao (pts)') || h.includes('points')
  );

  if (aberturaIndex === -1 || pnlIndex === -1) return null;

  function parseCurrencyVal(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const isNegative = String(val).includes('-');
    const clean = String(val).replace(/["'\s\u00A0R$]/g, '').replace(/-/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean) || 0;
    return isNegative ? -num : num;
  }

  function parsePriceVal(val) {
    if (!val) return 0;
    let s = String(val).replace(/["'\s\u00A0]/g, '');
    if (s.includes(',')) {
      s = s.split(',')[0].replace(/\./g, '');
    } else if (s.includes('.')) {
      s = s.replace(/\./g, '');
    }
    return parseFloat(s) || 0;
  }

  function parseDateIsoStr(aberturaRaw) {
    if (!aberturaRaw) return null;
    const clean = String(aberturaRaw).replace(/["']/g, '').trim();
    const [d] = clean.split(' ');
    if (!d) return null;

    if (d.includes('/')) {
      const parts = d.split('/');
      const dia = parts[0].padStart(2, '0');
      const mes = parts[1].padStart(2, '0');
      let ano = parts[2];
      if (!ano) {
        ano = new Date().getFullYear().toString();
      } else if (ano.length === 2) {
        ano = '20' + ano;
      }
      return `${ano}-${mes}-${dia}`;
    } else if (d.includes('-')) {
      const parts = d.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return d;
      } else {
        // DD-MM-YYYY
        const dia = parts[0].padStart(2, '0');
        const mes = parts[1].padStart(2, '0');
        let ano = parts[2] || new Date().getFullYear().toString();
        if (ano.length === 2) ano = '20' + ano;
        return `${ano}-${mes}-${dia}`;
      }
    }
    return null;
  }

  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    if (cols.length < 3) continue;
    const dateIso = parseDateIsoStr(cols[aberturaIndex]);
    if (!dateIso) continue;

    let status = statusIndex !== -1 ? (cols[statusIndex]?.replace(/["']/g, '') || '') : '';
    const qtd = qtdIndex !== -1 ? (parseInt(cols[qtdIndex]?.replace(/["']/g, ''), 10) || 2) : 2;
    const pnlRaw = cols[pnlIndex] || '0';
    let liquido = 0;
    let pontos = 0;

    if (pnlRaw.includes('|')) {
      const parts = pnlRaw.split('|');
      if (parts[1].includes('R$')) {
        // Exemplo Rocket / Profit: "0.01 | R$ 8,53"
        liquido = parseCurrencyVal(parts[1]);
      } else {
        // Exemplo Clássico: "98,53 | 250.0"
        liquido = parseCurrencyVal(parts[0]);
        pontos = parseFloat(parts[1].replace(/["']/g, '').trim()) || 0;
      }
    } else {
      liquido = parseCurrencyVal(pnlRaw);
    }

    // Se o status não for explícito, infere pelo resultado líquido
    if (!status) {
      status = liquido >= 0 ? 'Vencedora' : 'Perdedora';
    }

    // Se os pontos não vieram no P&L, tenta extrair da coluna de pontos ou da variação de preços
    if (pontos === 0 && pontosIndex !== -1 && cols[pontosIndex]) {
      pontos = parseFloat(cols[pontosIndex].replace(/["']/g, '').replace(',', '.')) || 0;
    }

    if (pontos === 0 && precoCIndex !== -1 && precoVIndex !== -1 && cols[precoCIndex] && cols[precoVIndex]) {
      const pC = parsePriceVal(cols[precoCIndex]);
      const pV = parsePriceVal(cols[precoVIndex]);
      const diff = Math.abs(pV - pC);
      const isLoss = status.toLowerCase().includes('perd') || liquido < 0;
      pontos = isLoss ? -diff : diff;
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

/**
 * Calcula a régua de stop técnico por contrato com base no % de risco do capital de perda
 * @param {number} capitalPerda Valor total de drawdown (ex: 2835)
 * @param {number} riscoPercentual Percentual de risco por trade (ex: 5)
 * @param {number} valorPonto Valor por ponto por contrato (ex: 0.20)
 */
export function calculateRiskTiers(capitalPerda = 2835, riscoPercentual = 5, valorPonto = CONFIG.VALOR_POR_PONTO_WIN) {
  const cap = Math.abs(Number(capitalPerda)) || 2835;
  const pct = Number(riscoPercentual) || 5;
  const vp = Number(valorPonto) || 0.20;

  const riscoFinanceiro = Math.round(((cap * pct) / 100) * 100) / 100;
  const pontosGlobais = Math.round(riscoFinanceiro / vp);

  const contratosList = [
    { contratos: 2, label: 'Mão Base' },
    { contratos: 3, label: 'Moderado' },
    { contratos: 4, label: 'Médio' },
    { contratos: 6, label: 'Mão Cheia' }
  ];

  const tiers = contratosList.map(c => {
    const pontos = Math.floor(pontosGlobais / c.contratos);
    let status = 'Estrutura Segura';
    let statusTipo = 'seguro';
    if (pontos < 150) {
      status = 'Inviável (Violino)';
      statusTipo = 'inviavel';
    } else if (pontos < 200) {
      status = 'Frágil (< 200 pts)';
      statusTipo = 'fragil';
    } else if (pontos < 250) {
      status = 'Viável (≥ 200 pts)';
      statusTipo = 'viavel';
    }

    return {
      contratos: c.contratos,
      label: c.label,
      pontos,
      status,
      statusTipo,
      isSeguro: pontos >= 200
    };
  });

  return {
    capitalPerda: cap,
    riscoPercentual: pct,
    riscoFinanceiro,
    pontosGlobais,
    tiers
  };
}

/**
 * Plano de Trade Padrão Oficial do Trader na Mesa Euroinvest
 */
export const PLANO_DE_TRADE_PADRAO = {
  setup: "Price Action ancorado em VWAP e Volume Profile (POC, VAH, VAL, nós HVN/LVN)",
  janelaOperacional: "09h15 até ATR(14)/5M cair abaixo de 250 pontos (aguardar 2 a 3 min no leilão das 10h00). Critério soberano: ATR mede liquidez diretamente — substitui a referência horária das 12h00",
  alvoPadraoPontos: 200,
  stopMinimoPontos: 200,
  maoBaseContratos: 2,
  maoMaximaContratos: 3,
  disjuntorGainDia: "R$ 150 a R$ 350 (desligar tela para proteger dia positivo)",
  disjuntorLossDia: "Equivalente ao teto de Risco/Trade do painel (% da Margem Livre = Saldo Acumulado + Piso). Desligar a tela imediatamente ao atingir o limite.",
  regrasBloqueio: [
    "Proibido preço médio contra rompimento de estrutura com volume",
    "Proibido operar com ATR(14)/5M abaixo de 250 pontos (mercado travado — critério soberano que substitui a referência das 12h00)",
    "Proibido scalping curto menor que 20 pontos (infração B3/Euroinvest)",
    "Proibido reentrada imediata no mesmo minuto de um stop técnico"
  ]
};


/**
 * Gera o documento Markdown estruturado de auditoria do pregão para ser submetido à IA
 * @param {Object} pregao Dados do pregão auditado
 * @param {Object} plano Parâmetros do Plano de Trade
 * @returns {string} Conteúdo em Markdown pronto para download/cópia
 */
export function gerarPromptAuditoriaMD(pregao, plano = PLANO_DE_TRADE_PADRAO) {
  if (!pregao) return "";

  const dataFormatada = pregao.data ? pregao.data.split('-').reverse().join('/') : "";
  const liquidoFmt = formatCurrency(pregao.resultadoLiquido, true);
  const brutoFmt = formatCurrency(pregao.resultadoBruto, true);
  const taxasFmt = formatCurrency(pregao.taxas);
  const totalTrades = (pregao.tradesVencedores || 0) + (pregao.tradesPerdedores || 0);

  return `# 🛡️ DOSSIÊ DE AUDITORIA OPERACIONAL — PREGÃO DE ${dataFormatada}
**Ativo:** Mini Índice B3 (WIN) | **Trader:** Marcio Leite  
**Mesa Proprietária:** Euroinvest (Plano Junior - R$ 1.400 Meta / R$ 2.835 Piso)

---

## 📋 1. PLANO DE TRADE OFICIAL (Gabarito de Conformidade)
* **Setup Autorizado:** ${plano.setup}
* **Janela Operacional Estrita:** ${plano.janelaOperacional}
* **Alvo Técnico Padrão:** ${plano.alvoPadraoPontos} pontos por trade
* **Stop Técnico Mínimo de Volatilidade:** ${plano.stopMinimoPontos} pontos (stops < 200 pts são asfixiados por ruído de HFT)
* **Dimensionamento:** Mão base de ${plano.maoBaseContratos} contratos (máximo rigoroso de ${plano.maoMaximaContratos} contratos)
* **Disjuntor de Ganho:** ${plano.disjuntorGainDia}
* **Disjuntor de Perda:** ${plano.disjuntorLossDia}
* **Regras de Bloqueio Operacional:**
${plano.regrasBloqueio.map(r => `  - ${r}`).join('\n')}

---

## 📊 2. DADOS OFICIAIS DO PREGÃO (${dataFormatada})
* **Resultado Líquido do Dia:** ${liquidoFmt}
* **Resultado Bruto:** ${brutoFmt} | **Custos/Taxas B3:** ${taxasFmt}
* **Pontos no WIN:** ${pregao.pontos > 0 ? '+' : ''}${pregao.pontos} pts
* **Operações:** ${pregao.tradesVencedores} Vencedoras (W) / ${pregao.tradesPerdedores} Perdedoras (L) — Total: ${totalTrades} trades
* **Mão Utilizada:** ${pregao.contratos} contratos
* **Horário Operado:** ${pregao.horarioInicio || 'Não especificado'} às ${pregao.horarioFim || 'Não especificado'}
* **Reflexão / Anotação do Trader:**
> "${pregao.analiseEstrategica || 'Sem notas adicionais informadas pelo trader.'}"

---

## 🤖 3. INSTRUÇÕES PARA A INTELIGÊNCIA ARTIFICIAL (GESTOR DE RISCO SÊNIOR)
Você é o **Head Coach e Gestor de Risco Chefe** da mesa proprietária Euroinvest.
Sua missão é auditar a performance do trader **confrontando o PRINT DO GRÁFICO (anexo) e os dados numéricos contra o PLANO DE TRADE OFICIAL**.

### ⚠️ ETAPA 0: CHECAGEM OBRIGATÓRIA DE INTEGRIDADE DO PRINT (VISUAL CHECK)
Antes de qualquer análise de conduta, avalie minuciosamente a imagem do gráfico anexada pelo trader e confirme:
1. **Data do Gráfico:** Corresponde exatamente à data da sessão auditada (**${dataFormatada}**)?
2. **Ativo Operado:** É o **Mini Índice B3** (WIN, WINFUT ou código do contrato vigente)?
3. **Tempo Gráfico:** Está visível e condizente com o setup (ex: 5 min, 2 min ou gráfico de fluxo/Renko)?

> **REGRA DE BLOQUEIO DE PRINT:** Caso o print seja de data divergente, de outro ativo (ex: Dólar/WDO, Ações), se o tempo gráfico estiver incorreto ou a imagem estiver ilegível:
> • Emita no VEREDITO: **"PRINT INCOMPATÍVEL / RETIFICAR IMAGEM"**.
> • Atribua Score 0.0 provisório até o envio da imagem correta.
> • Na DIRETRIZ, aponte a falha da imagem (ex: "Print enviado é do dia X e não do dia ${dataFormatada}") e oriente o operador a subir o print correto.

### 📐 MATRIZ OBJETIVA DE PONTUAÇÃO PONDERADA (RUBRIC DE 0.0 A 10.0):
A avaliação parte de **Base 10.0 pontos**. Aplique as deduções matemáticas exatas abaixo para garantir que a nota seja 100% reproduzível:

1. **Janela Operacional (Peso Máximo: 2.5 pts):**
   - Todas as operações com ATR(14)/5M ≥ 250 pts, respeitando o leilão das 10h00: Dedução 0.0.
   - Operou durante o leilão das 10h00 sem esperar 2 a 3 minutos: Dedução -0.5 pt.
   - Operou com ATR(14)/5M < 250 pts (mercado travado, independente do horário): Dedução -2.0 pts.
   - Sessão iniciada com ATR travado desde a abertura (ausência total do critério): Dedução -2.5 pts (perda total da dimensão).

2. **Lote & Simetria Operacional (Peso Máximo: 2.5 pts):**
   - 100% na mão base de 2 contratos (ou até 3 contratos dentro do risco): Dedução 0.0.
   - Assimetria de Lote (entradas fracionadas ou lotes divergentes): Dedução -1.5 pt.
   - Operação com 4 contratos ou mais (alavancagem excessiva / risco violino): Dedução -2.5 pts (perda total da dimensão).

3. **Gestão de Stop & Bloqueio de Preço Médio (Peso Máximo: 2.5 pts):**
   - Todos os stops técnicos respeitados (≥ 200 pts) e zero preço médio: Dedução 0.0.
   - Stop asfixiado menor que 200 pontos (ruído de HFT): Dedução -1.0 pt.
   - Fez preço médio contra o movimento / aumentou posição em loss: Dedução -2.5 pts (perda total da dimensão).

4. **Disjuntores Diários & Overtrading (Peso Máximo: 2.5 pts):**
   - Parou ao atingir a faixa do disjuntor (ganho ou perda conforme painel de risco) e desligou a plataforma: Dedução 0.0.
   - Continuou operando após disjuntor de gain ou loss (overtrading): Dedução -1.5 pt.
   - Recuperou prejuízo para o zero e continuou operando, devolvendo capital: Dedução -1.0 pt.

> **TRAVA CRÍTICA DE INDISCIPLINA (FAIL-SAFE):** Se ocorrerem duas infrações graves simultâneas (ex: preço médio contra rompimento + operação com ATR(14)/5M < 250 pts, ou ultrapassagem do teto de contratos + estouro do stop financeiro da Margem Livre), o Score Final é obrigatoriamente limitado ao teto máximo de **2.0**, independentemente das demais dimensões.

### FORMATO DE RESPOSTA OBRIGATÓRIO (RIGOROSO):
Responda OBRIGATORIAMENTE no seguinte padrão estruturado para leitura do terminal:

### MEMÓRIA DE CÁLCULO DO SCORE (Base: 10.0):
- [1] Janela Operacional: [Pontos Obtidos / 2.5] (Dedução: -X.X | Motivo)
- [2] Lote & Simetria: [Pontos Obtidos / 2.5] (Dedução: -X.X | Motivo)
- [3] Stop Técnico & Preço Médio: [Pontos Obtidos / 2.5] (Dedução: -X.X | Motivo)
- [4] Disjuntores & Parada: [Pontos Obtidos / 2.5] (Dedução: -X.X | Motivo)

### SCORE COMPORTAMENTAL: [Nota final de 0.0 a 10.0 com 1 casa decimal, ex: 8.5/10 ou 2.0/10]

### VEREDITO EXECUTIVO:
[Uma frase curta em caixa alta resumindo o veredito da sessão]

### SÍNTESE DA SESSÃO:
[Parágrafo objetivo de 3 a 4 linhas correlacionando o resultado financeiro com o comportamento real do trader]

### ACERTOS TÉCNICOS & DISCIPLINA:
- [Item 1]
- [Item 2]

### VULNERABILIDADES & DESVIOS:
- [Item 1]
- [Item 2]

### DIRETRIZ PARA O PRÓXIMO PREGÃO:
[Uma ordem técnica clara e direta para a próxima sessão de trading]
`;
}

/**
 * Faz o parse da resposta gerada pela IA, extraindo o Score e o Parecer estruturado
 * @param {string} texto Mensagem gerada pela IA
 * @returns {Object} { score, veredito, sintese, acertos, erros, diretriz, memoriaCalculo }
 */
export function parseRetornoAuditoriaIA(texto) {
  if (!texto || typeof texto !== 'string') return null;

  const res = {
    score: null,
    veredito: "",
    sintese: "",
    acertos: [],
    erros: [],
    diretriz: "",
    memoriaCalculo: ""
  };

  // Extrai Memória de Cálculo se presente
  const memoriaMatch = texto.match(/###\s*MEMÓRIA[^\n]*\n+([\s\S]*?)(?=###|$)/i);
  if (memoriaMatch) res.memoriaCalculo = memoriaMatch[1].trim();

  // Extrai Score (ex: "SCORE COMPORTAMENTAL: 8.5" ou "2.0/10" ou "2.0 / 10.0" ou "Nota: 9/10")
  const scoreMatch = texto.match(/SCORE(?:\s+COMPORTAMENTAL|\s+FINAL)?[:\s]*([0-9]+[.,]?[0-9]*)(?:\s*\/\s*10(?:\.0)?)?/i) ||
                     texto.match(/NOTA[:\s]*([0-9]+[.,]?[0-9]*)(?:\s*\/\s*10(?:\.0)?)?/i);
  if (scoreMatch && scoreMatch[1]) {
    const num = parseFloat(scoreMatch[1].replace(',', '.'));
    if (!isNaN(num)) {
      res.score = Math.min(10, Math.max(0, Number(num.toFixed(1))));
    }
  }

  // Extrai Veredito
  const vereditoMatch = texto.match(/###\s*VEREDITO[^\n]*\n+([^\n#]+)/i);
  if (vereditoMatch) res.veredito = vereditoMatch[1].trim();

  // Extrai Síntese
  const sinteseMatch = texto.match(/###\s*SÍNTESE[^\n]*\n+([\s\S]*?)(?=###|$)/i);
  if (sinteseMatch) res.sintese = sinteseMatch[1].trim();

  // Extrai Acertos
  const acertosMatch = texto.match(/###\s*ACERTOS[^\n]*\n+([\s\S]*?)(?=###|$)/i);
  if (acertosMatch) {
    res.acertos = acertosMatch[1]
      .split(/\n+/)
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);
  }

  // Extrai Vulnerabilidades / Erros
  const errosMatch = texto.match(/###\s*(?:VULNERABILIDADES|DESVIOS|ERROS)[^\n]*\n+([\s\S]*?)(?=###|$)/i);
  if (errosMatch) {
    res.erros = errosMatch[1]
      .split(/\n+/)
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);
  }

  // Extrai Diretriz
  const diretrizMatch = texto.match(/###\s*DIRETRIZ[^\n]*\n+([\s\S]*?)(?=###|$)/i);
  if (diretrizMatch) res.diretriz = diretrizMatch[1].trim();

  return res;
}
