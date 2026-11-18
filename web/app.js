/**
 * app.js — Controlador Principal da Interface do Terminal de Avaliação Euroinvest
 * Versão MVP PropFirmTradeCoach com Calendário Oficial 3 Estrelas
 */

import { CONFIG, calculateMetrics, checkAssimetriaLote, formatCurrency, formatPercent, parseProfitCSV, calculateRiskTiers, isPregaoConsolidado, PLANO_DE_TRADE_PADRAO, gerarPromptAuditoriaMD, parseRetornoAuditoriaIA } from './calculations.js';

const STORAGE_KEY = 'euroinvest_avaliacao_data_v1';

// Calendário Oficial de Eventos 3 Estrelas (Investing.com — Semana 16 a 20 de Novembro)
const CALENDARIO_OFICIAL = {
  "2026-11-16": {
    dataStr: "16/11",
    diaSemana: "Segunda-feira, 16 de Novembro",
    eventos: [
      { hora: "09:00", pais: "BR", flag: "🇧🇷", moeda: "BRL", nome: "IBC-Br (Setembro)", projecao: "-", anterior: "0,30%" },
      { hora: "14:00", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Discurso de Warsh, Governador do Fed", projecao: "-", anterior: "-" }
    ]
  },
  "2026-11-17": {
    dataStr: "17/11",
    diaSemana: "Terça-feira, 17 de Novembro",
    eventos: [
      { hora: "10:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Núcleo de Vendas no Varejo (Mensal) (Out)", projecao: "0,4%", anterior: "0,9%" },
      { hora: "10:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Vendas no Varejo (Mensal) (Out)", projecao: "0,0%", anterior: "0,8%" }
    ]
  },
  "2026-11-18": {
    dataStr: "18/11",
    diaSemana: "Quarta-feira, 18 de Novembro",
    eventos: [
      { hora: "12:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Estoques de Petróleo Bruto", projecao: "-", anterior: "4,657M" },
      { hora: "16:00", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Atas da Reunião do FOMC", projecao: "-", anterior: "-" }
    ]
  },
  "2026-11-19": {
    dataStr: "19/11",
    diaSemana: "Quinta-feira, 19 de Novembro",
    eventos: [
      { hora: "10:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Pedidos Iniciais por Seguro-Desemprego", projecao: "-", anterior: "200K" },
      { hora: "10:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Índice de Atividade Industrial Fed Filadélfia (Nov)", projecao: "-", anterior: "20,9" },
      { hora: "18:30", pais: "US", flag: "🇺🇸", moeda: "USD", nome: "Balanço Patrimonial do Federal Reserve", projecao: "-", anterior: "6.759B" }
    ]
  },
  "2026-11-20": {
    dataStr: "20/11",
    diaSemana: "Sexta-feira, 20 de Novembro",
    isFeriado: true,
    eventos: [
      { hora: "Todo o dia", pais: "BR", flag: "🇧🇷", moeda: "BRL", nome: "Feriado Nacional — Dia da Consciência Negra (B3 Fechada)", projecao: "-", anterior: "-" }
    ]
  }
};

let diaSelecionadoRadar = "2026-11-16"; // Padrão: Próxima sessão

// Estado global da aplicação
let appData = {
  version: "1.0",
  meta: {
    plano: "Euroinvest Plano Junior (WIN)",
    trader: "Marcio Leite",
    metaFinanceira: CONFIG.META_FINANCEIRA,
    pisoDrawdown: CONFIG.PISO_DRAWDOWN,
    maxPregões: CONFIG.MAX_PREGOES,
    minPregões: CONFIG.MIN_PREGOES,
    minTaxaDiasPositivos: CONFIG.MIN_TAXA_POSITIVOS,
    tetoConsistenciaDiaria: CONFIG.TETO_CONSISTENCIA_DIA,
    valorPorPontoContrato: CONFIG.VALOR_POR_PONTO_WIN,
    riscoMaximoPercentual: 5,
    maoBaseContratos: 2
  },
  pregoes: [],
  diasSemOperacao: []
};

let chartInstance = null;
let currentChartMode = 'operacional';
let editingPregaoId = null;
let stagedImportResult = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  loadData();
  setupEventListeners();
  setupCsvImportHandlers();
  determinarProximoDiaRadar();
  renderRadarEventos();
  verificarLembreteImportacao();
  renderApp();
});

/**
 * Determina automaticamente qual dia exibir no radar com base na data e hora atual
 */
function determinarProximoDiaRadar() {
  const hoje = new Date().toISOString().split('T')[0];
  const horaAtual = new Date().getHours();

  if (CALENDARIO_OFICIAL[hoje] && horaAtual < 18) {
    diaSelecionadoRadar = hoje;
  } else {
    // Busca o próximo dia útil presente no calendário
    const chaves = Object.keys(CALENDARIO_OFICIAL).sort();
    const proximo = chaves.find(k => k >= hoje);
    diaSelecionadoRadar = proximo || "2026-11-16";
  }
}

/**
 * Renderiza o radar de eventos limpo, sem badges redundantes, com seletor de dias
 */
function renderRadarEventos() {
  const container = document.getElementById('radarContainer');
  const tabsContainer = document.getElementById('radarTabs');
  if (!container || !tabsContainer) return;

  // Renderiza as abas de seleção dos dias da semana
  tabsContainer.innerHTML = Object.entries(CALENDARIO_OFICIAL).map(([dataKey, d]) => {
    const isSelected = dataKey === diaSelecionadoRadar;
    const activeClass = isSelected
      ? 'bg-amber-500/20 text-amber-300 border-amber-600 font-bold'
      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700 font-medium';

    return `
      <button onclick="window.selecionarDiaRadar('${dataKey}')" class="px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${activeClass}">
        ${d.dataStr} ${d.isFeriado ? '🇧🇷' : ''}
      </button>
    `;
  }).join('');

  const dadosDia = CALENDARIO_OFICIAL[diaSelecionadoRadar] || CALENDARIO_OFICIAL["2026-11-16"];
  document.getElementById('radarDiaTitulo').textContent = dadosDia.diaSemana;

  if (dadosDia.isFeriado) {
    container.innerHTML = `
      <div class="col-span-full p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🇧🇷</span>
          <div>
            <div class="font-bold text-white text-sm">Feriado Nacional — Dia da Consciência Negra</div>
            <div class="text-xs text-slate-400 mt-0.5">Mercado brasileiro (B3) fechado. Pregão suspenso na Euroinvest.</div>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800">Sem Operações</span>
      </div>
    `;
    return;
  }

  container.innerHTML = dadosDia.eventos.map(ev => {
    return `
      <div class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
        <span class="text-xl mt-0.5">${ev.flag}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono font-bold text-amber-400 text-sm">${ev.hora}</span>
            <span class="text-xs font-mono text-slate-400">${ev.moeda}</span>
          </div>
          <div class="font-semibold text-slate-200 text-xs leading-snug">${ev.nome}</div>
          <div class="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-400">
            <span>Proj: <strong class="text-slate-300">${ev.projecao}</strong></span>
            <span>•</span>
            <span>Ant: <strong class="text-slate-300">${ev.anterior}</strong></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.selecionarDiaRadar = function(dataKey) {
  diaSelecionadoRadar = dataKey;
  renderRadarEventos();
};

const AUDITED_INITIAL_PREGOES = [
  {
    id: "pregao-2026-11-12",
    data: "2026-11-12",
    contratos: 2,
    tradesVencedores: 1,
    tradesPerdedores: 4,
    tradesTotal: 5,
    pontos: 15.0,
    resultadoBruto: -54.00,
    taxas: 8.09,
    resultadoLiquido: -62.09,
    saldoApuradoDia: -62.09,
    horarioInicio: "13:46",
    horarioFim: "17:02",
    setup: "Price Action / Consolidação",
    assimetriaLote: true,
    consolidado: true,
    scoreComportamental: 5.5,
    analiseEstrategica: "Operação aberta fora do horário estipulado (pós-meio-dia). Entrada com 2 contratos na consolidação, adicionados mais 2 contratos esperando retomada que não ocorreu, gerando loss. O Trade 3 foi excelente (+310 pts), recuperando o dia e empatando a conta. O erro residiu em não desligar a tela naquele momento e insistir em operar à tarde num mercado com baixo volume e volatilidade, sofrendo 2 losses adicionais no fim do dia. Ponto positivo: encerrou a sessão com perda controlada (-R$ 62,09), prevenindo o aumento do drawdown e eliminando qualquer risco de dia de fúria.",
    parecerCoach: {
      veredito: "DESVIO DE JANELA & ASSIMETRIA DE LOTE",
      sintese: "A leitura técnica encerrou o dia com saldo positivo em pontos (+15,0 pts), contudo a eficiência financeira foi anulada pela assimetria de lote no Trade 2 e pela insistência em operar no período vespertino.",
      acertos: [
        "Leitura técnica e execução do Trade 3 (+310 pts com 2 contratos) foram de alta precisão, recuperando integralmente o prejuízo anterior.",
        "Maturidade e disciplina de corte final: encerrou a sessão com perda contida em R$ 62,09, preservando o capital e evitando escalada de risco."
      ],
      erros: [
        "Infração da janela operacional: primeira entrada executada às 13h46, contrariando a regra de operar exclusivamente pela manhã.",
        "Preço médio em consolidação: adição de 2 contratos contra o movimento gerou loss dobrado no Trade 2 (-150 pts = -R$ 120,00).",
        "Não realização do empate: após reverter o prejuízo às 15h01, permaneceu exposto ao mercado em horário de baixa liquidez, devolvendo R$ 60,94 em dois stops."
      ],
      diretriz: "Travar a mão base estritamente em 2 contratos. Operações limitadas impreterivelmente às 12h00. Quando a conta recuperar o saldo para o zero no meio do dia, encerrar a plataforma imediatamente."
    }
  },
  {
    id: "pregao-2026-11-13",
    data: "2026-11-13",
    contratos: 2,
    tradesVencedores: 5,
    tradesPerdedores: 1,
    tradesTotal: 6,
    pontos: 822.5,
    resultadoBruto: 329.00,
    taxas: 8.82,
    resultadoLiquido: 320.18,
    saldoApuradoDia: 320.18,
    horarioInicio: "09:05",
    horarioFim: "10:12",
    setup: "VWAP e Volume Profile (POC/VAH/VAL)",
    assimetriaLote: false,
    consolidado: true,
    scoreComportamental: 9.5,
    analiseEstrategica: "Execução perfeita na janela matinal (1h07 de tela). 100% na mão base de 2 contratos. Payoff de 3.49x. Único stop às 10:00 (abertura à vista) foi curto (-45 pts) e encerrado prontamente. Entrada seguinte limpa (+250 pts) e encerramento imediato do dia.",
    parecerCoach: {
      veredito: "EXECUÇÃO DE PADRÃO INSTITUCIONAL",
      sintese: "Sessão exemplar em conformidade com os requisitos da mesa. Simetria total de contratos, janela focada de 1h07 e excelente relação risco-retorno.",
      acertos: [
        "Disciplina rígida de lote: 100% das ordens executadas com a mão base de 2 contratos.",
        "Gestão impecável de risco: ganho médio de +173,5 pts contra perda média de -45,0 pts (Payoff 3,49x).",
        "Aceitação imediata do stop às 10h00 e encerramento da plataforma logo após bater a meta com a operação de +250 pts."
      ],
      erros: [
        "Ponto de atenção preventiva: o trade das 10h00 coincidiu com a abertura do mercado à vista (leilão das ações), momento de spread alargado. Recomenda-se aguardar de 2 a 3 minutos para estabilização do book."
      ],
      diretriz: "Repetir essa rotina sem alterações. Não alongar horário nem aumentar lote nos pregões seguintes."
    }
  }
];

/**
 * Carrega os dados do LocalStorage e garante integridade do histórico auditado
 */
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.pregoes)) {
        appData = parsed;
        if (!appData.meta) {
          appData.meta = { ...CONFIG };
        }
        if (!appData.meta.riscoMaximoPercentual) {
          appData.meta.riscoMaximoPercentual = 5;
        }
        if (!appData.meta.maoBaseContratos) {
          appData.meta.maoBaseContratos = 2;
        }
        if (!Array.isArray(appData.diasSemOperacao)) {
          appData.diasSemOperacao = [];
        }
        if (!appData.planoTrade) {
          appData.planoTrade = { ...PLANO_DE_TRADE_PADRAO };
        }

        // Garante que os pregões auditados oficiais estejam presentes (recuperação automática de histórico)
        const datasPresentes = new Set(appData.pregoes.map(p => p.data));
        for (const aud of AUDITED_INITIAL_PREGOES) {
          if (!datasPresentes.has(aud.data)) {
            appData.pregoes.push(aud);
          }
        }

        // Garante marcação de pregões consolidados
        appData.pregoes.forEach(p => {
          p.consolidado = p.consolidado || isPregaoConsolidado(p.data);
        });

        // Ordena cronologicamente
        appData.pregoes.sort((a, b) => a.data.localeCompare(b.data));
        saveData();
        return;
      }
    } catch (e) {
      console.warn("Erro ao ler LocalStorage", e);
    }
  }

  // Inicialização padrão com histórico oficial
  appData.pregoes = JSON.parse(JSON.stringify(AUDITED_INITIAL_PREGOES));
  appData.diasSemOperacao = [];
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData, null, 2));
}

/**
 * Renderização central de todos os blocos do dashboard
 */
function renderApp() {
  const metrics = calculateMetrics(appData.pregoes, appData.meta || {}, appData.diasSemOperacao || []);

  renderHeaderStatus(metrics);
  renderGestaoRisco();
  renderKPICards(metrics);
  renderDiagnosticBanner(metrics);
  renderChart(metrics);
  renderHistoryTable(metrics);
}

/**
 * Renderiza o bloco de Gestão Estratégica de Risco (Risco Máximo por Trade & Régua de Pontos)
 */
function renderGestaoRisco() {
  const container = document.getElementById('reguaContratosGrid');
  if (!container) return;

  const pct = appData.meta?.riscoMaximoPercentual || 5;
  const maoBase = appData.meta?.maoBaseContratos || 2;
  const pisoDrawdown = appData.meta?.pisoDrawdown || CONFIG.PISO_DRAWDOWN;
  const valorPonto = appData.meta?.valorPorPontoContrato || CONFIG.VALOR_POR_PONTO_WIN;

  const riskData = calculateRiskTiers(pisoDrawdown, pct, valorPonto);

  const elFin = document.getElementById('riscoFinanceiroTexto');
  if (elFin) elFin.textContent = formatCurrency(riskData.riscoFinanceiro);

  const elBadge = document.getElementById('riscoPercentualBadge');
  if (elBadge) elBadge.textContent = `${riskData.riscoPercentual.toFixed(1)}% do Piso`;

  const elPontos = document.getElementById('riscoPontosGlobais');
  if (elPontos) elPontos.textContent = `${riskData.pontosGlobais} pontos`;

  const selPct = document.getElementById('selectRiscoPercentual');
  if (selPct) selPct.value = String(pct);

  const selMao = document.getElementById('selectMaoBase');
  if (selMao) selMao.value = String(maoBase);

  container.innerHTML = riskData.tiers.map(t => {
    const isMaoBase = t.contratos === Number(maoBase);
    let borderClass = 'border-slate-800 bg-slate-900/60';
    let badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

    if (t.statusTipo === 'inviavel') {
      badgeColor = 'text-red-400 bg-red-950/60 border-red-800';
    } else if (t.statusTipo === 'fragil') {
      badgeColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
    } else if (t.statusTipo === 'viavel') {
      badgeColor = 'text-sky-400 bg-sky-950/60 border-sky-800';
    }

    if (isMaoBase) {
      borderClass = 'border-sky-600/80 bg-sky-950/30 ring-1 ring-sky-500/40';
    }

    return `
      <div class="p-2.5 rounded-lg border ${borderClass} flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-slate-200 text-xs">${t.contratos} cts</span>
            ${isMaoBase ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-900 text-sky-300 border border-sky-700">Base</span>' : `<span class="text-[10px] text-slate-500 font-mono">${t.label}</span>`}
          </div>
          <div class="mt-1 font-mono font-bold text-base ${t.pontos >= 200 ? 'text-white' : 'text-amber-400'}">
            ${t.pontos} <span class="text-xs font-normal text-slate-400">pts</span>
          </div>
        </div>
        <div class="mt-2">
          <span class="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}">
            ${t.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

window.atualizarParametrosRisco = function() {
  const selPct = document.getElementById('selectRiscoPercentual');
  const selMao = document.getElementById('selectMaoBase');
  if (!selPct || !selMao) return;

  if (!appData.meta) appData.meta = { ...CONFIG };
  appData.meta.riscoMaximoPercentual = parseFloat(selPct.value) || 5;
  appData.meta.maoBaseContratos = parseInt(selMao.value, 10) || 2;

  saveData();
  renderGestaoRisco();
};

/**
 * Renderiza o cabeçalho e status geral
 */
function renderHeaderStatus(m) {
  const badge = document.getElementById('statusBadge');
  if (badge) {
    badge.className = `px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${m.badgeColor}`;
    let label = 'Em Andamento';
    if (m.status === 'APROVADO') label = 'Aprovado na Avaliação';
    else if (m.status === 'META_BATIDA_PENDENTE') label = 'Meta Batida (Pendente Dias)';
    else if (m.status === 'REPROVADO_PISO') label = 'Piso Rompido';
    else if (m.status === 'PRAZO_ESGOTADO') label = 'Prazo Esgotado';
    else if (m.status === 'AGUARDANDO_DADOS') label = 'Aguardando Lançamentos';
    badge.textContent = `${label} (${m.totalPregoes}/${m.config.MAX_PREGOES} Pregões)`;
  }
}

/**
 * Renderiza o banner descritivo com o diagnóstico de inteligência
 */
function renderDiagnosticBanner(m) {
  const container = document.getElementById('diagnosticBanner');
  if (!container) return;

  let icon = 'info';
  let borderClass = 'border-blue-800 bg-blue-950/40 text-blue-200';

  if (m.status === 'APROVADO') {
    borderClass = 'border-emerald-600 bg-emerald-950/40 text-emerald-200';
    icon = 'check-circle';
  } else if (m.status === 'META_BATIDA_PENDENTE') {
    borderClass = 'border-amber-600 bg-amber-950/40 text-amber-200';
    icon = 'alert-triangle';
  } else if (m.status === 'REPROVADO_PISO') {
    borderClass = 'border-red-600 bg-red-950/40 text-red-200';
    icon = 'x-circle';
  } else if (m.status === 'AGUARDANDO_DADOS') {
    borderClass = 'border-slate-700 bg-slate-900/60 text-slate-300';
    icon = 'database';
  }

  container.className = `p-4 rounded-xl border flex items-start gap-3 transition-all ${borderClass}`;
  container.innerHTML = `
    <div class="mt-0.5 flex-shrink-0">
      <i data-lucide="${icon}" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 text-sm leading-relaxed">
      <div class="font-semibold text-white mb-0.5">Diagnóstico Estratégico da Avaliação:</div>
      <div>${m.diagnostico}</div>
      ${m.totalDiasSemOperacao > 0 ? `<div class="mt-1.5 font-mono text-xs text-slate-300">• ${m.totalDiasSemOperacao} pregão${m.totalDiasSemOperacao > 1 ? 'ões' : ''} sem operação no período.</div>` : ''}
    </div>
  `;
  if (window.lucide) lucide.createIcons({ root: container });
}

/**
 * Renderiza os 5 Cards de KPIs
 */
function renderKPICards(m) {
  const metaAlvo = m.config.META_FINANCEIRA;

  // Card 1: Saldo Real vs Saldo Apurado
  document.getElementById('cardSaldoReal').textContent = formatCurrency(m.saldoReal, true);
  document.getElementById('cardSaldoApurado').textContent = formatCurrency(m.saldoApurado, true);
  
  const progressoMeta = metaAlvo > 0 ? Math.min(100, Math.max(0, (m.saldoApurado / metaAlvo) * 100)) : 0;
  const barraSaldo = document.getElementById('progressBarSaldo');
  if (barraSaldo) {
    barraSaldo.style.width = `${progressoMeta}%`;
    barraSaldo.className = `h-full rounded-full transition-all duration-500 ${m.saldoApurado >= metaAlvo ? 'bg-emerald-500' : 'bg-emerald-400'}`;
  }
  document.getElementById('cardSaldoProgressoTexto').textContent = `${progressoMeta.toFixed(1)}% de ${formatCurrency(metaAlvo)}`;

  // Card 2: Meta Diária Recalibrada
  const metaDiariaEl = document.getElementById('cardMetaDiaria');
  metaDiariaEl.textContent = m.faltaParaMeta === 0 ? 'Meta Batida!' : formatCurrency(m.metaDiariaRecalibrada) + ' / dia';
  
  const metaSubEl = document.getElementById('cardMetaSub');
  if (m.faltaParaMeta === 0) {
    metaSubEl.textContent = `Aguarde cumprimento dos dias mínimos`;
    metaSubEl.className = 'text-xs text-emerald-400 font-medium';
  } else if (m.metaInviavelConsistencia) {
    metaSubEl.textContent = `⚠️ Meta > R$ 700/dia (inviável em ${m.diasRestantes10} dias)`;
    metaSubEl.className = 'text-xs text-amber-400 font-medium';
  } else {
    metaSubEl.textContent = `Faltam ${formatCurrency(m.faltaParaMeta)} em até ${m.diasRestantes10} pregões`;
    metaSubEl.className = 'text-xs text-slate-400';
  }

  // Card 3: % de Dias Positivos
  document.getElementById('cardTaxaPositivos').textContent = formatPercent(m.taxaDiasPositivos);
  const badgePositivos = document.getElementById('cardBadgePositivos');
  if (badgePositivos) {
    if (m.totalPregoes === 0) {
      badgePositivos.textContent = 'Sem pregões';
      badgePositivos.className = 'text-xs text-slate-500';
    } else if (m.taxaDiasPositivos >= m.config.MIN_TAXA_POSITIVOS) {
      badgePositivos.textContent = '🟢 Conforme (≥ 60%)';
      badgePositivos.className = 'text-xs font-semibold text-emerald-400';
    } else {
      badgePositivos.textContent = '🔴 Atenção (< 60%)';
      badgePositivos.className = 'text-xs font-semibold text-amber-400';
    }
  }
  document.getElementById('cardPositivosSub').textContent = `${m.diasPositivos}G / ${m.diasNegativos}L • Precisa de ${m.positivosFaltantesAlvo10} vitórias nos próx. ${m.diasRestantes10} pregões`;

  // Card 4: Margem Livre até o Piso
  document.getElementById('cardMargemPiso').textContent = formatCurrency(m.margemLivrePiso);
  document.getElementById('cardPisoSub').textContent = `Piso em ${formatCurrency(m.config.PISO_DRAWDOWN)} • ${m.percentualDrawdownUsado.toFixed(1)}% do limite usado`;
  const barraPiso = document.getElementById('progressBarPiso');
  if (barraPiso) {
    const pisoAbs = Math.abs(m.config.PISO_DRAWDOWN) || 2835;
    barraPiso.style.width = `${Math.min(100, Math.max(0, (m.margemLivrePiso / pisoAbs) * 100))}%`;
  }

  // Card 5: Acerto de Operações (Trades)
  document.getElementById('cardTradesWinRate').textContent = `${formatPercent(m.taxaAcertoTrades)} de Acerto`;
  document.getElementById('cardTradesSub').textContent = `${m.totalTradesGanhos}W / ${m.totalTradesPerdidos}L (${m.totalTrades} trades) • ${m.totalPontos > 0 ? '+' : ''}${m.totalPontos.toFixed(1)} pts WIN`;
}

/**
 * Renderiza o gráfico combinado
 */
function renderChart(m) {
  const ctx = document.getElementById('performanceChartCanvas');
  if (!ctx) return;

  const labels = [];
  const barData = [];
  const barColors = [];
  const lineData = [];
  const targetData = [];
  const floorData = [];

  const maxDays = m.config.MAX_PREGOES || 10;
  const metaAlvo = m.config.META_FINANCEIRA;
  const pisoAlvo = m.config.PISO_DRAWDOWN;

  for (let i = 1; i <= maxDays; i++) {
    const diaReal = m.historico[i - 1];
    let dataFormatada = '—';
    let scoreTexto = 'Score: —';
    if (diaReal && diaReal.data) {
      const [, mes, dia] = diaReal.data.split('-');
      dataFormatada = `${dia}/${mes}`;
      if (diaReal.scoreComportamental !== undefined && diaReal.scoreComportamental !== null) {
        scoreTexto = `Score: ${Number(diaReal.scoreComportamental).toFixed(1)}`;
      }
    }
    // Rótulo multi-linha no eixo X: Linha 1 = Pregão i, Linha 2 = Data (ex: 12/11), Linha 3 = Score IA
    labels.push([`Pregão ${i}`, dataFormatada, scoreTexto]);
    targetData.push(metaAlvo);
    floorData.push(pisoAlvo);

    if (diaReal) {
      barData.push(diaReal.resultadoLiquido);
      barColors.push(diaReal.resultadoLiquido >= 0 ? '#10B981' : '#EF4444');
      lineData.push(diaReal.saldoRealAcumulado);
    } else {
      barData.push(null);
      barColors.push('#374151');
      lineData.push(null);
    }
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const yMin = currentChartMode === 'operacional' ? -600 : -3000;
  const yMax = currentChartMode === 'operacional' ? 1600 : 1600;

  const datasets = [
    {
      type: 'bar',
      label: 'Resultado Líquido do Dia (R$)',
      data: barData,
      backgroundColor: barColors,
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 28,
      order: 2
    },
    {
      type: 'line',
      label: 'Saldo Acumulado (R$)',
      data: lineData,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#38BDF8',
      pointBorderColor: '#0F172A',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.25,
      fill: false,
      order: 1
    },
    {
      type: 'line',
      label: `Teto da Aprovação (+${formatCurrency(metaAlvo)})`,
      data: targetData,
      borderColor: '#34D399',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      order: 3
    }
  ];

  if (currentChartMode === 'completa') {
    datasets.push({
      type: 'line',
      label: `Piso de Perda Total (${formatCurrency(pisoAlvo)})`,
      data: floorData,
      borderColor: '#F87171',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      order: 4
    });
  }

  chartInstance = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 12 },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            title: function(items) {
              if (!items.length) return '';
              const raw = items[0].label;
              if (Array.isArray(raw)) {
                return `${raw[0]} (${raw[1]})`;
              }
              return raw;
            },
            label: function(context) {
              if (context.raw === null || context.raw === undefined) return '';
              const val = Number(context.raw);
              return `${context.dataset.label}: ${formatCurrency(val, true)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 11 },
            maxRotation: 0,
            autoSkip: false
          }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 12 },
            callback: (v) => formatCurrency(v)
          }
        }
      }
    }
  });
}

/**
 * Renderiza a Tabela de Histórico
 */
function renderHistoryTable(m) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (m.historico.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="py-12 text-center text-slate-500">Nenhum pregão registrado ainda. Use o formulário à esquerda ou clique em <strong>Restaurar</strong> acima para carregar o seu arquivo de backup.</td></tr>`;
    return;
  }

  tbody.innerHTML = m.historico.map(dia => {
    const isGain = dia.resultadoLiquido >= 0;
    const badgeColor = isGain ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' : 'text-red-400 bg-red-950/40 border-red-800';
    const sign = isGain ? '+' : '';
    const isConsolidado = dia.consolidado || isPregaoConsolidado(dia.data);

    let scoreBadge = `<button onclick="window.openAuditoriaModal('${dia.id}')" class="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800 transition-colors" title="Submeter à IA para obter Score">🤖 Auditar</button>`;
    if (dia.scoreComportamental !== undefined && dia.scoreComportamental !== null) {
      const scoreVal = Number(dia.scoreComportamental);
      let scoreCor = 'text-red-400 bg-red-950/40 border-red-800';
      if (scoreVal >= 8.5) {
        scoreCor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      } else if (scoreVal >= 6.0) {
        scoreCor = 'text-amber-400 bg-amber-950/40 border-amber-800';
      }
      scoreBadge = `
        <button onclick="window.openAuditoriaModal('${dia.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded border ${scoreCor} font-mono font-bold text-xs hover:opacity-80 transition-opacity" title="Clique para ver ou reauditar com IA">
          <span>${scoreVal.toFixed(1)}</span>
        </button>
      `;
    }

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="py-3 px-4">
          <button onclick="window.openCoachModal('${dia.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 transition-colors shadow-sm" title="Abrir Parecer Operacional do Coach">
            <i data-lucide="${isConsolidado ? 'shield-check' : 'shield'}" class="w-3.5 h-3.5 ${isConsolidado ? 'text-emerald-400' : 'text-sky-400'}"></i>
            <span>#${dia.pregaoNumero}</span>
            ${isConsolidado ? '<i data-lucide="lock" class="w-3 h-3 text-emerald-400/80 ml-0.5" title="Consolidado pós-B3 (Imutável)"></i>' : ''}
          </button>
        </td>
        <td class="py-3 px-4 text-xs font-mono text-slate-300">
          <div class="flex items-center gap-1.5">
            <span>${formatDateBR(dia.data)}</span>
            ${isConsolidado ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">Fechado</span>' : ''}
          </div>
        </td>
        <td class="py-3 px-4 text-xs font-mono text-slate-400">${dia.tradesVencedores}W / ${dia.tradesPerdedores}L</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-300">${dia.contratos} cts</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-300">${dia.pontos > 0 ? '+' : ''}${dia.pontos} pts</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-400">${formatCurrency(dia.resultadoBruto, true)}</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-400">${formatCurrency(dia.taxas)}</td>
        <td class="py-3 px-4 text-xs font-mono font-bold">
          <span class="px-2 py-0.5 rounded border ${badgeColor}">
            ${sign}${formatCurrency(dia.resultadoLiquido)}
          </span>
          ${dia.teveExcedenteConsistencia ? `<span class="ml-1 text-[10px] text-amber-400" title="Excedente de R$ 700 descartado na apuração">⚠️ Capped</span>` : ''}
        </td>
        <td class="py-3 px-3 text-xs font-mono text-center">
          ${scoreBadge}
        </td>
        <td class="py-3 px-4 text-xs font-mono font-semibold text-sky-400">${formatCurrency(dia.saldoRealAcumulado, true)}</td>
        <td class="py-3 px-4 text-xs font-mono ${dia.taxaDiasPositivosAcumulada >= 60 ? 'text-emerald-400' : 'text-amber-400'}">${dia.taxaDiasPositivosAcumulada}%</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="window.openAuditoriaModal('${dia.id}')" class="p-1.5 rounded-lg hover:bg-slate-700 text-indigo-400 hover:text-indigo-300" title="Auditoria IA / Dossiê .MD">
              <i data-lucide="bot" class="w-4 h-4"></i>
            </button>
            <button onclick="window.openCoachModal('${dia.id}')" class="p-1.5 rounded-lg hover:bg-slate-700 text-sky-400 hover:text-sky-300" title="Parecer do Coach">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </button>
            ${isConsolidado ? `
              <span class="p-1.5 text-slate-600 cursor-not-allowed" title="Pregão consolidado pós-B3 (Bloqueado para alteração)">
                <i data-lucide="lock" class="w-4 h-4 text-slate-500"></i>
              </span>
            ` : `
              <button onclick="window.deletePregao('${dia.id}')" class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400" title="Excluir pregão em aberto">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons({ root: tbody });
}

function formatDateBR(isoStr) {
  if (!isoStr) return '';
  const [ano, mes, dia] = isoStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Configuração dos ouvintes de eventos da página
 */
function setupEventListeners() {
  const toggleBtn = document.getElementById('btnToggleScale');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentChartMode = currentChartMode === 'operacional' ? 'completa' : 'operacional';
      toggleBtn.textContent = currentChartMode === 'operacional' ? 'Ver Escala Completa (Piso)' : 'Foco Operacional (Zoom)';
      renderChart(calculateMetrics(appData.pregoes, appData.meta || {}));
    });
  }

  const inputPontos = document.getElementById('inputPontos');
  const inputContratos = document.getElementById('inputContratos');
  const inputBruto = document.getElementById('inputBruto');
  const inputTaxas = document.getElementById('inputTaxas');

  if (inputBruto && inputTaxas && inputPontos && inputContratos) {
    const updateFormCalculations = () => {
      const bruto = parseFloat(inputBruto.value) || 0;
      const taxas = parseFloat(inputTaxas.value) || 0;
      const liquido = bruto - taxas;

      const preview = document.getElementById('inputLiquidoPreview');
      if (preview) preview.textContent = formatCurrency(liquido, true);

      const pontos = parseFloat(inputPontos.value) || 0;
      const contratos = parseInt(inputContratos.value) || 2;
      const valorPonto = appData.meta?.valorPorPontoContrato || CONFIG.VALOR_POR_PONTO_WIN;
      const hasAssimetria = checkAssimetriaLote(pontos, contratos, bruto, valorPonto);

      const warningEl = document.getElementById('assimetriaWarning');
      if (warningEl) {
        if (hasAssimetria && (pontos !== 0 || bruto !== 0)) {
          warningEl.classList.remove('hidden');
        } else {
          warningEl.classList.add('hidden');
        }
      }
    };

    [inputPontos, inputContratos, inputBruto, inputTaxas].forEach(inp => {
      if (inp) inp.addEventListener('input', updateFormCalculations);
    });
  }

  const form = document.getElementById('tradeForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  document.getElementById('btnExportJson')?.addEventListener('click', exportJsonData);
  document.getElementById('btnExportDossier')?.addEventListener('click', window.openDossierModal);
  document.getElementById('btnImportJson')?.addEventListener('click', () => {
    document.getElementById('fileInputImport')?.click();
  });
  document.getElementById('fileInputImport')?.addEventListener('change', importJsonData);
  document.getElementById('btnConnectDrive')?.addEventListener('click', connectLocalDriveFile);
}

function handleFormSubmit() {
  const data = document.getElementById('inputData').value;
  const contratos = parseInt(document.getElementById('inputContratos').value) || 2;
  const wins = parseInt(document.getElementById('inputWins').value) || 0;
  const losses = parseInt(document.getElementById('inputLosses').value) || 0;
  const pontos = parseFloat(document.getElementById('inputPontos').value) || 0;
  const bruto = parseFloat(document.getElementById('inputBruto').value) || 0;
  const taxas = parseFloat(document.getElementById('inputTaxas').value) || 0;
  const horarioInicio = document.getElementById('inputHorarioInicio').value;
  const horarioFim = document.getElementById('inputHorarioFim').value;
  const setup = document.getElementById('inputSetup').value;
  const printFile = document.getElementById('inputPrintFile').value.trim();
  const analise = document.getElementById('inputAnalise').value;

  if (!data) {
    alert("Por favor, informe a data do pregão.");
    return;
  }

  const existingIndex = appData.pregoes.findIndex(p => p.data === data && p.id !== editingPregaoId);
  if (existingIndex !== -1) {
    const existingPregao = appData.pregoes[existingIndex];
    if (existingPregao && (existingPregao.consolidado || isPregaoConsolidado(existingPregao.data))) {
      alert(`O pregão de ${formatDateBR(data)} já foi encerrado e consolidado após o fechamento da B3. Registros consolidados são imutáveis.`);
      return;
    }
    if (!confirm(`Já existe um pregão registrado na data ${formatDateBR(data)}. Deseja sobrescrever os dados desse dia?`)) {
      return;
    }
    appData.pregoes.splice(existingIndex, 1);
  }

  const liquido = Number((bruto - taxas).toFixed(2));
  const valorPonto = appData.meta?.valorPorPontoContrato || CONFIG.VALOR_POR_PONTO_WIN;
  const hasAssimetria = checkAssimetriaLote(pontos, contratos, bruto, valorPonto);
  const tetoConsistencia = appData.meta?.tetoConsistenciaDiaria || CONFIG.TETO_CONSISTENCIA_DIA;

  const parecerGerado = gerarParecerOperacional({
    data,
    contratos,
    wins,
    losses,
    pontos,
    bruto,
    liquido,
    horarioInicio,
    horarioFim,
    hasAssimetria,
    analise
  });

  const pregaoObj = {
    id: editingPregaoId || `pregao-${data}`,
    data,
    contratos,
    tradesVencedores: wins,
    tradesPerdedores: losses,
    tradesTotal: wins + losses,
    pontos,
    resultadoBruto: bruto,
    taxas,
    resultadoLiquido: liquido,
    saldoApuradoDia: Math.min(liquido, tetoConsistencia),
    horarioInicio,
    horarioFim,
    setup,
    printFile,
    assimetriaLote: hasAssimetria,
    analiseEstrategica: analise,
    parecerCoach: parecerGerado,
    consolidado: isPregaoConsolidado(data)
  };

  if (editingPregaoId) {
    const idx = appData.pregoes.findIndex(p => p.id === editingPregaoId);
    if (idx !== -1) {
      if (appData.pregoes[idx].parecerCoach && !appData.pregoes[idx].parecerCoach.autoGerado) {
        pregaoObj.parecerCoach = appData.pregoes[idx].parecerCoach;
      }
      appData.pregoes[idx] = pregaoObj;
    }
    editingPregaoId = null;
    document.getElementById('btnSubmitForm').textContent = 'Salvar Pregão';
    document.getElementById('btnCancelEdit').classList.add('hidden');
  } else {
    appData.pregoes.push(pregaoObj);
  }

  appData.pregoes.sort((a, b) => new Date(a.data) - new Date(b.data));

  saveData();
  renderApp();

  document.getElementById('tradeForm').reset();
  document.getElementById('inputData').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputContratos').value = '2';
  document.getElementById('inputLiquidoPreview').textContent = 'R$ 0,00';
  document.getElementById('assimetriaWarning').classList.add('hidden');
  alert("Pregão salvo com sucesso!");
}

/**
 * Motor gerador de parecer operacional sóbrio e impessoal para novos pregões
 */
function gerarParecerOperacional(d) {
  const isGain = d.liquido > 0;
  const isLoss = d.liquido < 0;
  const totalTrades = d.wins + d.losses;
  const winRate = totalTrades > 0 ? (d.wins / totalTrades) * 100 : 0;

  let veredito = isGain ? "CONFORMIDADE OPERACIONAL" : "AJUSTE DE EXECUÇÃO";
  let sintese = `Sessão encerrada com ${totalTrades} trades (${d.wins}W / ${d.losses}L) e saldo líquido de ${formatCurrency(d.liquido, true)}.`;

  const acertos = [];
  const erros = [];

  if (isGain) {
    acertos.push(`Aproveitamento positivo no fechamento do saldo (${formatCurrency(d.liquido, true)}).`);
  }
  if (d.contratos === 2) {
    acertos.push("Manutenção da mão base regulamentar de 2 contratos.");
  }
  if (winRate >= 60) {
    acertos.push(`Taxa de acerto operacional elevada (${winRate.toFixed(1)}%).`);
  }

  if (d.hasAssimetria) {
    erros.push("Assimetria identificada entre pontos e financeiro: divergência na ponderação do lote.");
    veredito = "ALERTA: ASSIMETRIA DE LOTE";
  }
  if (totalTrades > 6) {
    erros.push(`Excesso de operações (${totalTrades} trades no pregão), aumentando custos de emolumentos e exposição a risco.`);
  }
  if (d.horarioFim && d.horarioFim > "12:00") {
    erros.push(`Operações estendidas até ${d.horarioFim}, além do limite recomendado da janela matinal.`);
  }
  if (isLoss && acertos.length === 0) {
    acertos.push("Execução dos stops conforme parâmetros de risco definidos para a sessão.");
  }
  if (erros.length === 0) {
    erros.push("Nenhum desvio crítico identificado na gestão do risco da sessão.");
  }

  let diretriz = isGain
    ? "Preservar a rotina de execução sem alongar horários nem aumentar mão na sessão seguinte."
    : "Revisar a disciplina de encerramento na janela matinal e manter rigor na simetria de lote.";

  return {
    autoGerado: true,
    veredito,
    sintese,
    acertos,
    erros,
    diretriz
  };
}

/**
 * Modal do Parecer Operacional do Coach (Sóbrio e Impessoal)
 */
window.openCoachModal = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  const coach = dia.parecerCoach || gerarParecerOperacional({
    data: dia.data,
    contratos: dia.contratos,
    wins: dia.tradesVencedores,
    losses: dia.tradesPerdedores,
    pontos: dia.pontos,
    bruto: dia.resultadoBruto,
    liquido: dia.resultadoLiquido,
    horarioInicio: dia.horarioInicio,
    horarioFim: dia.horarioFim,
    hasAssimetria: dia.assimetriaLote,
    analise: dia.analiseEstrategica
  });

  const modal = document.getElementById('modalCoach');
  document.getElementById('modalCoachTitle').textContent = `Parecer de Mesa — Pregão #${dia.pregaoNumero || ''} (${formatDateBR(dia.data)})`;
  document.getElementById('modalCoachSubtitle').textContent = `Horário: ${dia.horarioInicio || '--:--'} às ${dia.horarioFim || '--:--'} • Mão: ${dia.contratos} cts • Líquido: ${formatCurrency(dia.resultadoLiquido, true)}`;

  document.getElementById('modalCoachVeredito').textContent = coach.veredito || 'EM ANÁLISE';
  const vereditoBox = document.getElementById('modalCoachVereditoBox');
  if (dia.resultadoLiquido >= 0) {
    vereditoBox.className = 'p-3 rounded-xl border border-emerald-800 bg-emerald-950/40 text-emerald-300 flex items-center justify-between';
  } else {
    vereditoBox.className = 'p-3 rounded-xl border border-amber-800 bg-amber-950/40 text-amber-300 flex items-center justify-between';
  }

  const printTag = document.getElementById('modalCoachPrintTag');
  if (dia.printFile) {
    printTag.innerHTML = `<span class="inline-flex items-center gap-1 text-[11px] text-sky-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"><i data-lucide="image" class="w-3 h-3"></i> ${dia.printFile}</span>`;
  } else {
    printTag.innerHTML = `<span class="text-[11px] text-slate-500">Sem print anexado</span>`;
  }

  document.getElementById('modalCoachSintese').textContent = coach.sintese || dia.analiseEstrategica || 'Sem notas registradas para a sessão.';

  const ulAcertos = document.getElementById('modalCoachAcertos');
  ulAcertos.innerHTML = (coach.acertos || ["Execução conforme o plano."]).map(item => `<li>${item}</li>`).join('');

  const ulErros = document.getElementById('modalCoachErros');
  ulErros.innerHTML = (coach.erros || ["Sem desvios registrados."]).map(item => `<li>${item}</li>`).join('');

  document.getElementById('modalCoachDiretriz').textContent = coach.diretriz || "Manter foco nos parâmetros da avaliação da Euroinvest.";

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons({ root: modal });
};

window.closeCoachModal = function() {
  document.getElementById('modalCoach').classList.add('hidden');
};

/**
 * Modal Dossiê para Auditoria da IA (Consolidado ou Pregão Específico)
 */
window.openDossierModal = function(pregaoIdSelecionado = null) {
  const modal = document.getElementById('modalDossier');
  const select = document.getElementById('selectDossierEscopo');
  if (!modal) return;

  // Popula o select com a opção consolidada + cada pregão cadastrado
  if (select) {
    select.innerHTML = `
      <option value="consolidado">📊 Avaliação Consolidada (Todos os Pregões)</option>
      ${appData.pregoes.map(p => `
        <option value="${p.id}" ${pregaoIdSelecionado === p.id ? 'selected' : ''}>
          Pregão #${p.pregaoNumero || '?'} — ${formatDateBR(p.data)} (${formatCurrency(p.resultadoLiquido, true)})
        </option>
      `).join('')}
    `;
    if (pregaoIdSelecionado) {
      select.value = pregaoIdSelecionado;
    }
  }

  window.onChangeDossierEscopo();

  modal.classList.remove('hidden');
  document.getElementById('copySuccessMsg')?.classList.add('hidden');
  if (window.lucide) lucide.createIcons({ root: modal });
};

window.onChangeDossierEscopo = function() {
  const select = document.getElementById('selectDossierEscopo');
  const textarea = document.getElementById('dossierTextarea');
  const titulo = document.getElementById('dossierModalTitulo');
  if (!textarea || !select) return;

  const escopo = select.value;
  if (escopo === 'consolidado') {
    if (titulo) titulo.textContent = 'Dossiê Consolidado da Avaliação (Visão Geral)';
    const metrics = calculateMetrics(appData.pregoes, appData.meta || {});
    let md = `# DOSSIÊ DE AUDITORIA ESTATÍSTICA E COMPORTAMENTAL — TRADER MARCIO LEITE\n`;
    md += `Mesa Proprietária: Euroinvest (Plano Junior WIN)\n`;
    md += `Meta: ${formatCurrency(metrics.config.META_FINANCEIRA)} | Piso: ${formatCurrency(metrics.config.PISO_DRAWDOWN)}\n`;
    md += `Data da Extração: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    md += `## RESUMO CONSOLIDADO ATUAL\n`;
    md += `- Pregões Operados: ${metrics.totalPregoes} de ${metrics.config.MAX_PREGOES}\n`;
    md += `- Saldo Real Acumulado: ${formatCurrency(metrics.saldoReal, true)}\n`;
    md += `- Saldo Apurado (Teto R$ 700/dia): ${formatCurrency(metrics.saldoApurado, true)}\n`;
    md += `- Taxa de Dias Positivos: ${metrics.taxaDiasPositivos}% (${metrics.diasPositivos}G / ${metrics.diasNegativos}L)\n`;
    md += `- Meta Diária Recalibrada para 10 dias: ${formatCurrency(metrics.metaDiariaRecalibrada)} / dia\n`;
    md += `- Margem Livre até o Piso: ${formatCurrency(metrics.margemLivrePiso)}\n`;
    md += `- Total de Trades: ${metrics.totalTrades} (${metrics.totalTradesGanhos}W / ${metrics.totalTradesPerdidos}L — ${metrics.taxaAcertoTrades}% win rate)\n`;
    md += `- Pontos Mini Índice: ${metrics.totalPontos} pts\n\n`;

    md += `## TABELA HISTÓRICA SESSÃO A SESSÃO\n`;
    md += `| # | Data | Trades W/L | Mão | Pontos | Bruto | Taxas | Líquido | Acumulado | Horário | Análise do Trader |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

    metrics.historico.forEach(d => {
      md += `| #${d.pregaoNumero} | ${formatDateBR(d.data)} | ${d.tradesVencedores}W/${d.tradesPerdedores}L | ${d.contratos} cts | ${d.pontos} | ${formatCurrency(d.resultadoBruto)} | ${formatCurrency(d.taxas)} | ${formatCurrency(d.resultadoLiquido)} | ${formatCurrency(d.saldoRealAcumulado)} | ${d.horarioInicio || '--'}-${d.horarioFim || '--'} | ${d.analiseEstrategica || 'Sem notas'} |\n`;
    });

    md += `\n## INSTRUÇÃO DE ANÁLISE PARA A INTELIGÊNCIA ARTIFICIAL:\n`;
    md += `Atue como um Engenheiro Sênior de Risco e Gestor de Mesa Proprietária (Prop Firm Risk Manager). Com base nos dados acima:\n`;
    md += `1. Analise friamente a consistência estatística (relação payoff, assimetria de lotes, horários operados);\n`;
    md += `2. Identifique os padrões comportamentais de maior sangria financeira e onde residem os acertos técnicos mais consistentes;\n`;
    md += `3. Projete a viabilidade matemática de aprovação mantendo a regra dos >= 60% de dias positivos e respeitando o limite de 10 pregões;\n`;
    md += `4. Entregue um plano de ação estrito, sem bajulação, focado exclusivamente em blindar o capital e garantir a aprovação.\n`;

    textarea.value = md;
  } else {
    const pregao = appData.pregoes.find(p => p.id === escopo);
    if (pregao) {
      if (titulo) titulo.textContent = `Dossiê de Auditoria — Pregão #${pregao.pregaoNumero || '?'} (${formatDateBR(pregao.data)})`;
      textarea.value = gerarPromptAuditoriaMD(pregao, appData.planoTrade || PLANO_DE_TRADE_PADRAO);
    }
  }
};

window.baixarDossierAtual = function() {
  const select = document.getElementById('selectDossierEscopo');
  const textarea = document.getElementById('dossierTextarea');
  if (!textarea) return;

  const escopo = select ? select.value : 'consolidado';
  let nomeArquivo = `dossie_consolidado_euroinvest_${new Date().toISOString().split('T')[0]}.md`;
  if (escopo !== 'consolidado') {
    const pregao = appData.pregoes.find(p => p.id === escopo);
    if (pregao) nomeArquivo = `auditoria_pregao_${pregao.data}.md`;
  }

  const blob = new Blob([textarea.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
};

window.closeDossierModal = function() {
  document.getElementById('modalDossier').classList.add('hidden');
};

window.copyDossierText = function() {
  const textarea = document.getElementById('dossierTextarea');
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    const msg = document.getElementById('copySuccessMsg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
  });
};

window.editPregao = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  if (dia.consolidado || isPregaoConsolidado(dia.data)) {
    alert(`O pregão de ${formatDateBR(dia.data)} já foi encerrado e consolidado após o fechamento da B3. Registros consolidados são imutáveis.`);
    return;
  }

  const inputData = document.getElementById('inputData');
  if (!inputData) return;

  editingPregaoId = id;
  inputData.value = dia.data;
  document.getElementById('inputContratos')?.setAttribute('value', dia.contratos || 2);
  document.getElementById('inputWins')?.setAttribute('value', dia.tradesVencedores || 0);
  document.getElementById('inputLosses')?.setAttribute('value', dia.tradesPerdedores || 0);
  document.getElementById('inputPontos')?.setAttribute('value', dia.pontos || 0);
  document.getElementById('inputBruto')?.setAttribute('value', dia.resultadoBruto || 0);
  document.getElementById('inputTaxas')?.setAttribute('value', dia.taxas || 0);
};

window.cancelEdit = function() {
  editingPregaoId = null;
  const form = document.getElementById('tradeForm');
  if (form) form.reset();
};

window.deletePregao = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  if (dia.consolidado || isPregaoConsolidado(dia.data)) {
    alert(`O pregão de ${formatDateBR(dia.data)} já foi encerrado e consolidado após o fechamento da B3. Não é permitida a exclusão de pregões oficiais.`);
    return;
  }

  if (confirm(`Confirma a exclusão do pregão de ${formatDateBR(dia.data)}?`)) {
    appData.pregoes = appData.pregoes.filter(p => p.id !== id);
    saveData();
    renderApp();
  }
};

function exportJsonData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const dataHoje = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("download", `dados_avaliacao_euroinvest_${dataHoje}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importJsonData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!parsed || !Array.isArray(parsed.pregoes)) {
        throw new Error("Arquivo JSON inválido. O campo 'pregoes' deve ser uma lista.");
      }

      if (confirm(`Arquivo validado com ${parsed.pregoes.length} pregões. Deseja carregar este backup?`)) {
        appData = parsed;
        if (!appData.meta) {
          appData.meta = { ...CONFIG };
        }
        saveData();
        renderApp();
        alert("Backup importado com sucesso!");
      }
    } catch (err) {
      alert("Falha ao importar JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

async function connectLocalDriveFile() {
  if (!('showOpenFilePicker' in window)) {
    alert("A File System Access API está disponível em navegadores Chromium no desktop (Chrome/Edge). Em outros dispositivos, utilize os botões Backup JSON / Restaurar.");
    return;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Arquivo JSON da Avaliação',
        accept: { 'application/json': ['.json'] }
      }],
      multiple: false
    });

    const file = await handle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (parsed && Array.isArray(parsed.pregoes)) {
      appData = parsed;
      if (!appData.meta) {
        appData.meta = { ...CONFIG };
      }
      saveData();
      renderApp();
      document.getElementById('driveIndicator').innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
          <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Drive Sincronizado (${file.name})
        </span>
      `;
      if (window.lucide) lucide.createIcons({ root: document.getElementById('driveIndicator') });
      alert("Arquivo do Drive conectado e sincronizado com sucesso!");
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      alert("Não foi possível conectar ao arquivo: " + err.message);
    }
  }
}

/**
 * Lembrete Semanal / Fechamento de Pregão
 */
function verificarLembreteImportacao() {
  const hoje = new Date().toISOString().split('T')[0];
  const dispensado = localStorage.getItem('euroinvest_lembrete_dispensado');
  if (dispensado === hoje) return;

  const diaSemana = new Date().getDay(); // 0 = Dom, 5 = Sex, 6 = Sab
  const hora = new Date().getHours();
  
  // Ativa se for sexta-feira após as 17h, final de semana, segunda antes das 12h, ou sem trades
  const isFechamentoSemana = (diaSemana === 5 && hora >= 17) || diaSemana === 6 || diaSemana === 0;
  const isInicioSemana = (diaSemana === 1 && hora < 12);
  const isVazio = !appData.pregoes || appData.pregoes.length === 0;

  if (isFechamentoSemana || isInicioSemana || isVazio) {
    const alertEl = document.getElementById('alertLembreteRelatorio');
    if (alertEl) {
      alertEl.classList.remove('hidden');
      if (window.lucide) lucide.createIcons({ root: alertEl });
    }
  }
}

window.dispensarLembrete = function() {
  const hoje = new Date().toISOString().split('T')[0];
  localStorage.setItem('euroinvest_lembrete_dispensado', hoje);
  const alertEl = document.getElementById('alertLembreteRelatorio');
  if (alertEl) alertEl.classList.add('hidden');
};

/**
 * Handlers do Modal de Importação CSV
 */
window.openModalImportCsv = function() {
  const modal = document.getElementById('modalImportCsv');
  if (!modal) return;
  modal.classList.remove('hidden');
  stagedImportResult = null;
  const btnConfirm = document.getElementById('btnConfirmImportCsv');
  if (btnConfirm) btnConfirm.disabled = true;
  const preview = document.getElementById('csvPreviewArea');
  if (preview) preview.classList.add('hidden');
  const txt = document.getElementById('textareaCsvContent');
  if (txt) txt.value = '';
  if (window.lucide) lucide.createIcons({ root: modal });
};

window.closeModalImportCsv = function() {
  const modal = document.getElementById('modalImportCsv');
  if (modal) modal.classList.add('hidden');
  stagedImportResult = null;
};

function setupCsvImportHandlers() {
  const dropZone = document.getElementById('dropZoneCsv');
  const fileInput = document.getElementById('inputCsvFile');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) lerArquivoCsv(file);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-sky-400', 'bg-sky-950/20');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-sky-400', 'bg-sky-950/20');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-sky-400', 'bg-sky-950/20');
      const file = e.dataTransfer.files[0];
      if (file) lerArquivoCsv(file);
    });
  }
}

function lerArquivoCsv(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const txtArea = document.getElementById('textareaCsvContent');
    if (txtArea) txtArea.value = text;
    window.processarTextoCsv();
  };
  reader.readAsText(file);
}

window.processarTextoCsv = function() {
  const txtArea = document.getElementById('textareaCsvContent');
  const previewArea = document.getElementById('csvPreviewArea');
  const previewTitle = document.getElementById('csvPreviewTitle');
  const previewDetails = document.getElementById('csvPreviewDetails');
  const btnConfirm = document.getElementById('btnConfirmImportCsv');

  if (!txtArea || !previewArea) return;

  const raw = txtArea.value.trim();
  if (!raw) {
    alert("Cole o conteúdo do CSV ou selecione um arquivo.");
    return;
  }

  const result = parseProfitCSV(raw);
  if (!result || !result.pregoes || result.pregoes.length === 0) {
    previewArea.classList.remove('hidden');
    previewArea.className = 'p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs font-mono text-red-300';
    previewTitle.textContent = "Erro na leitura do CSV";
    previewDetails.textContent = "Não foi possível identificar colunas válidas de data e P&L. Verifique se o arquivo é a exportação de Operações do Profit.";
    btnConfirm.disabled = true;
    stagedImportResult = null;
    return;
  }

  stagedImportResult = result;
  previewArea.classList.remove('hidden');
  previewArea.className = 'p-3.5 rounded-xl bg-sky-950/40 border border-sky-800 text-xs font-mono text-slate-200';
  
  const totalTrades = result.totalTrades || 0;
  previewTitle.textContent = `✓ ${result.pregoes.length} pregão(ões) com trades identificados (${totalTrades} operações).`;

  const semOpMsg = result.diasSemOperacao && result.diasSemOperacao.length > 0
    ? `• ${result.diasSemOperacao.length} pregão(ões) sem operação identificados no intervalo (${result.diasSemOperacao.join(', ')}).`
    : '• Nenhum gap de dia útil no período.';

  previewDetails.innerHTML = `
    <div>${semOpMsg}</div>
    <div class="mt-1 text-slate-400">Clique em "Salvar no Terminal" para aplicar ao seu histórico oficial.</div>
  `;

  btnConfirm.disabled = false;
};

window.confirmarImportacaoCsv = function() {
  if (!stagedImportResult || !stagedImportResult.pregoes) return;

  // Mapa com todos os pregões existentes (preservação cumulativa estrita)
  const mapaPregoes = new Map();
  for (const p of appData.pregoes) {
    const isConsolidado = p.consolidado || isPregaoConsolidado(p.data);
    mapaPregoes.set(p.data, { ...p, consolidado: isConsolidado });
  }

  let novosAdicionados = 0;
  let consolidadosBloqueados = 0;
  let abertosAtualizados = 0;

  for (const imp of stagedImportResult.pregoes) {
    const existente = mapaPregoes.get(imp.data);
    const deveConsolidar = isPregaoConsolidado(imp.data);

    if (existente) {
      if (existente.consolidado) {
        // PREGÃO JÁ CONSOLIDADO PÓS-B3: Imutável, bloqueado para sobreescrita
        consolidadosBloqueados++;
      } else {
        // Atualiza pregão ainda aberto no dia corrente
        mapaPregoes.set(imp.data, {
          ...existente,
          contratos: imp.contratos,
          tradesVencedores: imp.tradesVencedores,
          tradesPerdedores: imp.tradesPerdedores,
          pontos: imp.pontos,
          resultadoBruto: imp.resultadoBruto,
          taxas: imp.taxas,
          resultadoLiquido: imp.resultadoLiquido,
          consolidado: deveConsolidar
        });
        abertosAtualizados++;
      }
    } else {
      // Novo pregão inserido de forma cumulativa (nunca apaga o histórico prévio)
      mapaPregoes.set(imp.data, {
        id: `pregao-${imp.data}`,
        data: imp.data,
        contratos: imp.contratos,
        tradesVencedores: imp.tradesVencedores,
        tradesPerdedores: imp.tradesPerdedores,
        pontos: imp.pontos,
        resultadoBruto: imp.resultadoBruto,
        taxas: imp.taxas,
        resultadoLiquido: imp.resultadoLiquido,
        parecerCoach: null,
        consolidado: deveConsolidar
      });
      novosAdicionados++;
    }
  }

  // Ordena cronologicamente e renumera pregão 1, 2, 3...
  const ordenados = Array.from(mapaPregoes.values()).sort((a, b) => a.data.localeCompare(b.data));
  appData.pregoes = ordenados.map((p, idx) => ({
    ...p,
    pregaoNumero: idx + 1
  }));

  // Mescla diasSemOperacao sem duplicação e sem conflitar com dias operados
  const setSemOp = new Set(appData.diasSemOperacao || []);
  if (Array.isArray(stagedImportResult.diasSemOperacao)) {
    for (const d of stagedImportResult.diasSemOperacao) {
      if (!mapaPregoes.has(d)) {
        setSemOp.add(d);
      }
    }
  }
  appData.diasSemOperacao = Array.from(setSemOp).filter(d => !mapaPregoes.has(d)).sort();

  saveData();
  renderApp();
  window.closeModalImportCsv();

  let msg = `Importação concluída com sucesso! Total no histórico: ${appData.pregoes.length} pregões.`;
  if (novosAdicionados > 0) msg += `\n• ${novosAdicionados} novo(s) pregão(ões) adicionado(s).`;
  if (abertosAtualizados > 0) msg += `\n• ${abertosAtualizados} pregão(ões) em aberto atualizado(s).`;
  if (consolidadosBloqueados > 0) msg += `\n• ${consolidadosBloqueados} pregão(ões) consolidado(s) pós-B3 mantido(s) inalterado(s).`;
  alert(msg);
};

/**
 * Funções de Controle do Plano de Trade Oficial e Auditoria IA
 */
let selectedPregaoAuditoria = null;

window.openModalPlanoTrade = function() {
  const modal = document.getElementById('modalPlanoTrade');
  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modal });
  }
};

window.closeModalPlanoTrade = function() {
  const modal = document.getElementById('modalPlanoTrade');
  if (modal) modal.classList.add('hidden');
};

window.openAuditoriaModal = function(pregaoId) {
  const pregao = appData.pregoes.find(p => p.id === pregaoId);
  if (!pregao) {
    alert("Pregão não encontrado.");
    return;
  }
  selectedPregaoAuditoria = pregao;

  const modal = document.getElementById('modalAuditoriaIA');
  const titulo = document.getElementById('auditoriaModalTitulo');
  const subtitulo = document.getElementById('auditoriaModalSubtitulo');
  const preview = document.getElementById('auditoriaMdPreview');
  const inputScore = document.getElementById('inputAuditoriaScore');
  const inputVeredito = document.getElementById('inputAuditoriaVeredito');
  const textareaResposta = document.getElementById('textareaRespostaIA');
  const feedbackMsg = document.getElementById('auditoriaFeedbackMsg');

  if (titulo) titulo.textContent = `Auditoria com IA — Pregão #${pregao.pregaoNumero || '?'} (${formatDateBR(pregao.data)})`;
  if (subtitulo) subtitulo.textContent = `Líquido: ${formatCurrency(pregao.resultadoLiquido, true)} | Pontos: ${pregao.pontos > 0 ? '+' : ''}${pregao.pontos} pts`;

  // Gera o markdown do dossiê com plano de trade e dados da sessão
  const markdownText = gerarPromptAuditoriaMD(pregao, appData.planoTrade || PLANO_DE_TRADE_PADRAO);
  if (preview) preview.value = markdownText;

  // Carrega valores existentes se já auditado
  if (inputScore) inputScore.value = (pregao.scoreComportamental !== undefined && pregao.scoreComportamental !== null) ? pregao.scoreComportamental : '';
  if (inputVeredito) inputVeredito.value = pregao.parecerCoach?.veredito || '';
  if (textareaResposta) {
    if (pregao.parecerCoach?.rawResponse) {
      textareaResposta.value = pregao.parecerCoach.rawResponse;
    } else if (pregao.parecerCoach?.sintese) {
      textareaResposta.value = `### VEREDITO\n${pregao.parecerCoach.veredito || ''}\n\n### SCORE COMPORTAMENTAL\n${pregao.scoreComportamental || '-'}/10\n\n### SÍNTESE DA ATUAÇÃO\n${pregao.parecerCoach.sintese}`;
    } else {
      textareaResposta.value = '';
    }
  }
  if (feedbackMsg) feedbackMsg.classList.add('hidden');

  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ root: modal });
  }
};

window.closeModalAuditoriaIA = function() {
  const modal = document.getElementById('modalAuditoriaIA');
  if (modal) modal.classList.add('hidden');
  selectedPregaoAuditoria = null;
};

window.baixarArquivoAuditoriaMD = function() {
  if (!selectedPregaoAuditoria) return;
  const preview = document.getElementById('auditoriaMdPreview');
  const conteudo = preview ? preview.value : gerarPromptAuditoriaMD(selectedPregaoAuditoria, appData.planoTrade || PLANO_DE_TRADE_PADRAO);
  const blob = new Blob([conteudo], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_pregao_${selectedPregaoAuditoria.data}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.copiarTextoMdAuditoria = function() {
  const preview = document.getElementById('auditoriaMdPreview');
  if (!preview) return;
  preview.select();
  navigator.clipboard.writeText(preview.value).then(() => {
    alert("Dossiê copiado com sucesso! Agora anexe ou cole no Claude/Gemini junto com o print do gráfico.");
  }).catch(() => {
    document.execCommand('copy');
    alert("Dossiê copiado!");
  });
};

window.processarColagemRespostaIA = function() {
  const textarea = document.getElementById('textareaRespostaIA');
  if (!textarea) return;
  const texto = textarea.value;
  if (!texto || texto.trim().length < 20) return;

  const parsed = parseRetornoAuditoriaIA(texto);
  const inputScore = document.getElementById('inputAuditoriaScore');
  const inputVeredito = document.getElementById('inputAuditoriaVeredito');
  const feedbackMsg = document.getElementById('auditoriaFeedbackMsg');

  if (parsed.score !== null && inputScore) {
    inputScore.value = parsed.score;
  }
  if (parsed.veredito && inputVeredito) {
    inputVeredito.value = parsed.veredito;
  }
  if (feedbackMsg) {
    feedbackMsg.textContent = `✓ Dados extraídos: Score ${parsed.score !== null ? parsed.score : '—'}/10`;
    feedbackMsg.classList.remove('hidden');
  }
};

window.salvarAuditoriaIA = function() {
  if (!selectedPregaoAuditoria) {
    alert("Nenhum pregão selecionado.");
    return;
  }

  const inputScore = document.getElementById('inputAuditoriaScore');
  const inputVeredito = document.getElementById('inputAuditoriaVeredito');
  const textareaResposta = document.getElementById('textareaRespostaIA');

  const scoreNum = (inputScore && inputScore.value !== '') ? parseFloat(inputScore.value) : null;
  const veredito = inputVeredito ? inputVeredito.value.trim() : '';
  const rawText = textareaResposta ? textareaResposta.value.trim() : '';

  if (scoreNum !== null && (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10)) {
    alert("Por favor, informe um Score Comportamental válido entre 0 e 10 (ex: 8.5).");
    return;
  }

  // Parse do texto para extrair acertos, erros e diretrizes
  const parsed = parseRetornoAuditoriaIA(rawText);

  // Localiza o pregão no appData
  const idx = appData.pregoes.findIndex(p => p.id === selectedPregaoAuditoria.id);
  if (idx === -1) {
    alert("Pregão não encontrado para atualização.");
    return;
  }

  appData.pregoes[idx].scoreComportamental = scoreNum;
  appData.pregoes[idx].parecerCoach = {
    veredito: veredito || parsed.veredito || "AVALIAÇÃO DE DESEMPENHO",
    sintese: parsed.sintese || rawText.substring(0, 300) || "Auditoria realizada via IA.",
    acertos: parsed.acertos && parsed.acertos.length > 0 ? parsed.acertos : (appData.pregoes[idx].parecerCoach?.acertos || []),
    erros: parsed.erros && parsed.erros.length > 0 ? parsed.erros : (appData.pregoes[idx].parecerCoach?.erros || []),
    diretriz: parsed.diretriz || (appData.pregoes[idx].parecerCoach?.diretriz || "Seguir estritamente o plano de trade."),
    rawResponse: rawText
  };

  saveData();
  renderApp();
  window.closeModalAuditoriaIA();
  alert(`Auditoria do Pregão #${appData.pregoes[idx].pregaoNumero || ''} salva com sucesso!\nScore Comportamental: ${scoreNum !== null ? scoreNum.toFixed(1) : 'Não informado'}`);
};
