/**
 * app.js — Controlador Principal da Interface do Terminal de Avaliação Euroinvest
 */

import { CONFIG, calculateMetrics, checkAssimetriaLote, formatCurrency, formatPercent } from './calculations.js';

const STORAGE_KEY = 'euroinvest_avaliacao_data_v1';
const CHECKLIST_KEY = 'euroinvest_premarket_checklist_v1';

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
    valorPorPontoContrato: CONFIG.VALOR_POR_PONTO_WIN
  },
  pregoes: []
};

let chartInstance = null;
let currentChartMode = 'operacional'; // 'operacional' (-500 a 1600) ou 'completa' (-2835 a 1600)
let editingPregaoId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  loadData();
  setupEventListeners();
  loadChecklist();
  renderApp();
});

/**
 * Carrega os dados do LocalStorage ou do arquivo JSON inicial padrão
 */
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.pregoes)) {
        appData = parsed;
        return;
      }
    } catch (e) {
      console.warn("Erro ao ler LocalStorage, revertendo para dados iniciais", e);
    }
  }

  // Dados iniciais padrão (dias 12/11 e 13/11 auditados)
  appData.pregoes = [
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
      setup: "Price Action / Estruturas",
      assimetriaLote: true,
      analiseEstrategica: "Operou fora da janela ideal (tarde). Trade 2 tomou loss com 4 contratos (-150 pts = -R$ 120), enquanto o gain de +310 pts foi com apenas 2 contratos (+R$ 124). Houve reentrada imediata às 16:49 após stop. Lição: manter tamanho de mão simétrico (2 contratos fixos) e respeitar o fim da manhã."
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
      analiseEstrategica: "Execução perfeita na janela matinal (1h07 de tela). 100% na mão base de 2 contratos. Payoff de 3.49x. Único stop às 10:00 (abertura à vista) foi curto (-45 pts) e encerrado prontamente. Entrada seguinte limpa (+250 pts) e encerramento imediato do dia."
    }
  ];
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData, null, 2));
}

/**
 * Renderização central de todos os blocos do dashboard
 */
function renderApp() {
  const metrics = calculateMetrics(appData.pregoes);

  renderHeaderStatus(metrics);
  renderKPICards(metrics);
  renderDiagnosticBanner(metrics);
  renderChart(metrics);
  renderHistoryTable(metrics);
}

/**
 * Renderiza o cabeçalho e status geral
 */
function renderHeaderStatus(m) {
  const badge = document.getElementById('statusBadge');
  if (badge) {
    badge.className = `px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${m.badgeColor}`;
    let label = 'Em Andamento';
    if (m.status === 'APROVADO') label = 'Aprovado na Avaliação';
    else if (m.status === 'META_BATIDA_PENDENTE') label = 'Meta Batida (Pendente Dias)';
    else if (m.status === 'REPROVADO_PISO') label = 'Piso Rompido';
    else if (m.status === 'PRAZO_ESGOTADO') label = 'Prazo Esgotado';
    badge.textContent = `${label} (${m.totalPregoes}/${CONFIG.MAX_PREGOES} Pregões)`;
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
  }

  container.className = `p-4 rounded-xl border flex items-start gap-3 transition-all ${borderClass}`;
  container.innerHTML = `
    <div class="mt-0.5 flex-shrink-0">
      <i data-lucide="${icon}" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 text-sm leading-relaxed">
      <div class="font-semibold text-white mb-0.5">Diagnóstico Estratégico da Avaliação:</div>
      ${m.diagnostico}
    </div>
  `;
  if (window.lucide) lucide.createIcons({ root: container });
}

/**
 * Renderiza os 5 Cards de KPIs
 */
function renderKPICards(m) {
  // Card 1: Saldo Real vs Saldo Apurado
  document.getElementById('cardSaldoReal').textContent = formatCurrency(m.saldoReal, true);
  document.getElementById('cardSaldoApurado').textContent = formatCurrency(m.saldoApurado, true);
  
  const progressoMeta = Math.min(100, Math.max(0, (m.saldoApurado / CONFIG.META_FINANCEIRA) * 100));
  const barraSaldo = document.getElementById('progressBarSaldo');
  if (barraSaldo) {
    barraSaldo.style.width = `${progressoMeta}%`;
    barraSaldo.className = `h-full rounded-full transition-all duration-500 ${m.saldoApurado >= CONFIG.META_FINANCEIRA ? 'bg-emerald-500' : 'bg-emerald-400'}`;
  }
  document.getElementById('cardSaldoProgressoTexto').textContent = `${progressoMeta.toFixed(1)}% de R$ 1.400,00`;

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
    if (m.taxaDiasPositivos >= CONFIG.MIN_TAXA_POSITIVOS) {
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
  document.getElementById('cardPisoSub').textContent = `Piso em -R$ 2.835,00 • ${m.percentualDrawdownUsado.toFixed(1)}% do limite usado`;
  const barraPiso = document.getElementById('progressBarPiso');
  if (barraPiso) {
    barraPiso.style.width = `${Math.min(100, (m.margemLivrePiso / 2835) * 100)}%`;
  }

  // Card 5: Acerto de Operações (Trades)
  document.getElementById('cardTradesWinRate').textContent = `${formatPercent(m.taxaAcertoTrades)} de Acerto`;
  document.getElementById('cardTradesSub').textContent = `${m.totalTradesGanhos}W / ${m.totalTradesPerdidos}L (${m.totalTrades} trades) • ${m.totalPontos > 0 ? '+' : ''}${m.totalPontos.toFixed(1)} pts WIN`;
}

/**
 * Renderiza o gráfico combinado (Barras diárias + Linha acumulada + Linha de Teto)
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

  // Gera dados para os 10 pregões
  for (let i = 1; i <= CONFIG.MAX_PREGOES; i++) {
    labels.push(`Pregão ${i}`);
    targetData.push(CONFIG.META_FINANCEIRA);
    floorData.push(CONFIG.PISO_DRAWDOWN);

    const diaReal = m.historico[i - 1];
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
      label: 'Teto da Aprovação (+R$ 1.400,00)',
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
      label: 'Piso de Perda Total (-R$ 2.835,00)',
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
          ticks: { color: '#94A3B8', font: { family: 'Inter', size: 12 } }
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
    tbody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-slate-500">Nenhum pregão registrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = m.historico.map(dia => {
    const isGain = dia.resultadoLiquido >= 0;
    const badgeColor = isGain ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' : 'text-red-400 bg-red-950/40 border-red-800';
    const sign = isGain ? '+' : '';

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="py-3 px-4 text-xs font-mono font-semibold text-slate-300">#${dia.pregaoNumero}</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-300">${formatDateBR(dia.data)}</td>
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
        <td class="py-3 px-4 text-xs font-mono font-semibold text-sky-400">${formatCurrency(dia.saldoRealAcumulado, true)}</td>
        <td class="py-3 px-4 text-xs font-mono ${dia.taxaDiasPositivosAcumulada >= 60 ? 'text-emerald-400' : 'text-amber-400'}">${dia.taxaDiasPositivosAcumulada}%</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="window.viewDailyStrategy('${dia.id}')" class="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white" title="Ver Análise Estratégica">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </button>
            <button onclick="window.editPregao('${dia.id}')" class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-300" title="Editar">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="window.deletePregao('${dia.id}')" class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400" title="Excluir">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
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
  // Toggle de escala do gráfico
  const toggleBtn = document.getElementById('btnToggleScale');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentChartMode = currentChartMode === 'operacional' ? 'completa' : 'operacional';
      toggleBtn.textContent = currentChartMode === 'operacional' ? 'Ver Escala Completa (Piso)' : 'Foco Operacional (Zoom)';
      renderChart(calculateMetrics(appData.pregoes));
    });
  }

  // Formulário de novo pregão: recálculo em tempo real de Líquido e Assimetria
  const inputPontos = document.getElementById('inputPontos');
  const inputContratos = document.getElementById('inputContratos');
  const inputBruto = document.getElementById('inputBruto');
  const inputTaxas = document.getElementById('inputTaxas');

  const updateFormCalculations = () => {
    const bruto = parseFloat(inputBruto.value) || 0;
    const taxas = parseFloat(inputTaxas.value) || 0;
    const liquido = bruto - taxas;

    document.getElementById('inputLiquidoPreview').textContent = formatCurrency(liquido, true);

    const pontos = parseFloat(inputPontos.value) || 0;
    const contratos = parseInt(inputContratos.value) || 2;
    const hasAssimetria = checkAssimetriaLote(pontos, contratos, bruto);

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

  // Submissão do formulário
  const form = document.getElementById('tradeForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  // Botões de Exportar / Importar
  document.getElementById('btnExportJson')?.addEventListener('click', exportJsonData);
  document.getElementById('btnImportJson')?.addEventListener('click', () => {
    document.getElementById('fileInputImport')?.click();
  });
  document.getElementById('fileInputImport')?.addEventListener('change', importJsonData);

  // Botão Conectar Drive (File System Access API)
  document.getElementById('btnConnectDrive')?.addEventListener('click', connectLocalDriveFile);

  // Checklist interativo
  document.querySelectorAll('.premarket-check').forEach(chk => {
    chk.addEventListener('change', saveChecklist);
  });
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
  const analise = document.getElementById('inputAnalise').value;

  if (!data) {
    alert("Por favor, informe a data do pregão.");
    return;
  }

  // Prevenção de duplicidade de data (se não estiver editando o mesmo)
  const existingIndex = appData.pregoes.findIndex(p => p.data === data && p.id !== editingPregaoId);
  if (existingIndex !== -1) {
    if (!confirm(`Já existe um pregão registrado na data ${formatDateBR(data)}. Deseja sobrescrever os dados desse dia?`)) {
      return;
    }
    // Remove o antigo para substituir
    appData.pregoes.splice(existingIndex, 1);
  }

  const liquido = Number((bruto - taxas).toFixed(2));
  const hasAssimetria = checkAssimetriaLote(pontos, contratos, bruto);

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
    saldoApuradoDia: Math.min(liquido, CONFIG.TETO_CONSISTENCIA_DIA),
    horarioInicio,
    horarioFim,
    setup,
    assimetriaLote: hasAssimetria,
    analiseEstrategica: analise
  };

  if (editingPregaoId) {
    const idx = appData.pregoes.findIndex(p => p.id === editingPregaoId);
    if (idx !== -1) appData.pregoes[idx] = pregaoObj;
    editingPregaoId = null;
    document.getElementById('btnSubmitForm').textContent = 'Salvar Pregão';
    document.getElementById('btnCancelEdit').classList.add('hidden');
  } else {
    appData.pregoes.push(pregaoObj);
  }

  // Ordena por data cronológica
  appData.pregoes.sort((a, b) => new Date(a.data) - new Date(b.data));

  saveData();
  renderApp();

  // Limpa formulário
  document.getElementById('tradeForm').reset();
  document.getElementById('inputData').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputContratos').value = '2';
  document.getElementById('inputLiquidoPreview').textContent = 'R$ 0,00';
  document.getElementById('assimetriaWarning').classList.add('hidden');
  alert("Pregão salvo com sucesso!");
}

// Funções expostas globalmente no objeto window para os botões da tabela
window.viewDailyStrategy = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  const modal = document.getElementById('modalStrategy');
  document.getElementById('modalStrategyTitle').textContent = `Análise Estratégica — Pregão de ${formatDateBR(dia.data)}`;
  document.getElementById('modalStrategyTime').textContent = `${dia.horarioInicio || '--:--'} às ${dia.horarioFim || '--:--'}`;
  document.getElementById('modalStrategySetup').textContent = dia.setup || 'Não informado';
  document.getElementById('modalStrategyAssimetria').textContent = dia.assimetriaLote ? 'Sim (mãos desiguais entre trades)' : 'Não (mão simétrica)';
  document.getElementById('modalStrategyText').textContent = dia.analiseEstrategica || 'Nenhum comentário estratégico registrado.';

  modal.classList.remove('hidden');
};

window.closeStrategyModal = function() {
  document.getElementById('modalStrategy').classList.add('hidden');
};

window.editPregao = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  editingPregaoId = id;
  document.getElementById('inputData').value = dia.data;
  document.getElementById('inputContratos').value = dia.contratos || 2;
  document.getElementById('inputWins').value = dia.tradesVencedores || 0;
  document.getElementById('inputLosses').value = dia.tradesPerdedores || 0;
  document.getElementById('inputPontos').value = dia.pontos || 0;
  document.getElementById('inputBruto').value = dia.resultadoBruto || 0;
  document.getElementById('inputTaxas').value = dia.taxas || 0;
  document.getElementById('inputHorarioInicio').value = dia.horarioInicio || '';
  document.getElementById('inputHorarioFim').value = dia.horarioFim || '';
  document.getElementById('inputSetup').value = dia.setup || '';
  document.getElementById('inputAnalise').value = dia.analiseEstrategica || '';

  document.getElementById('btnSubmitForm').textContent = 'Atualizar Pregão';
  document.getElementById('btnCancelEdit').classList.remove('hidden');

  // Trigger input calculations
  document.getElementById('inputBruto').dispatchEvent(new Event('input'));
  window.scrollTo({ top: document.getElementById('tradeForm').offsetTop - 80, behavior: 'smooth' });
};

window.cancelEdit = function() {
  editingPregaoId = null;
  document.getElementById('tradeForm').reset();
  document.getElementById('inputData').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputContratos').value = '2';
  document.getElementById('btnSubmitForm').textContent = 'Salvar Pregão';
  document.getElementById('btnCancelEdit').classList.add('hidden');
  document.getElementById('inputLiquidoPreview').textContent = 'R$ 0,00';
  document.getElementById('assimetriaWarning').classList.add('hidden');
};

window.deletePregao = function(id) {
  const dia = appData.pregoes.find(p => p.id === id);
  if (!dia) return;

  if (confirm(`Confirma a exclusão do pregão de ${formatDateBR(dia.data)}?`)) {
    appData.pregoes = appData.pregoes.filter(p => p.id !== id);
    saveData();
    renderApp();
  }
};

/**
 * Exporta o backup JSON completo para download
 */
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

/**
 * Importa backup JSON com validação de formato
 */
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

      if (confirm(`Arquivo validado com ${parsed.pregoes.length} pregões. Deseja restaurar este backup e substituir os dados atuais?`)) {
        appData = parsed;
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

/**
 * Conexão com Google Drive local (File System Access API opcional)
 */
async function connectLocalDriveFile() {
  if (!('showOpenFilePicker' in window)) {
    alert("A File System Access API está disponível apenas em navegadores Chromium (Chrome/Edge no desktop). Use os botões Exportar/Importar JSON para backup.");
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
 * Gestão do Checklist Pré-Pregão
 */
function loadChecklist() {
  const saved = localStorage.getItem(CHECKLIST_KEY);
  if (!saved) return;
  try {
    const checks = JSON.parse(saved);
    document.querySelectorAll('.premarket-check').forEach((chk, idx) => {
      chk.checked = !!checks[idx];
    });
  } catch (e) {
    console.warn("Erro ao ler checklist", e);
  }
}

function saveChecklist() {
  const checks = Array.from(document.querySelectorAll('.premarket-check')).map(c => c.checked);
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checks));
}
