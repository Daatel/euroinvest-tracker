# 📋 Plano de Especificação Técnica e Arquitetura (Revisado com Claude)
## Terminal Web de Avaliação — Euroinvest Plano Junior (WIN)

**Projeto:** Terminal Web de Gestão Operacional e Acompanhamento da Avaliação  
**Mesa / Plano:** Euroinvest — Plano Junior Mini Índice (WIN)  
**Trader:** Marcio Leite  
**Hospedagem:** Vercel (Hobby Plan — 100% Gratuito)  
**Persistência Principal:** LocalStorage + Exportação/Importação JSON (com Drive opcional)  
**Versão:** 2.0 (Revisada e Aprovada pós-auditoria Claude)  
**Data:** 13/11/2026  

---

## 1. Ajustes Críticos Incorporados da Revisão

### 1.1 Inconsistência do Dia 1 Esclarecida e Validação de Contratos
* **O que ocorreu no Dia 1:** A divergência (+15 pts vs. -R$ 54,00) foi causada pela **assimetria de lote** registrada no Dossiê:
  * Trade 2 com **4 contratos** tomou -150 pts (-R$ 120,00).
  * Trade 3 com **2 contratos** fez +310 pts (+R$ 124,00).
  * Saldo em pontos: $+15,0$ pts. Saldo financeiro bruto: $-R\$ 54,00$.
* **Solução no App:**
  * Campo obrigatório de **Contratos Padrão/Predominante** no formulário.
  * Validação em tempo real: se `Pontos * 0,20 * Contratos != Bruto`, o app exibe uma etiqueta informativa: *"⚠️ Assimetria de Lotes detectada entre os trades do pregão (registrada no Dossiê)"*.

### 1.2 Distinção entre Saldo Real vs. Saldo Apurado (Teto de R$ 700/dia)
* **Regra da Mesa:** A Euroinvest descarta qualquer lucro diário excedente a **R$ 700,00** (50% da meta).
* **Dois Saldos Exibidos:**
  * **Saldo Real Acumulado:** O valor financeiro total efetivamente obtido na plataforma.
  * **Saldo Apurado (Regulamentar):** Onde cada dia positivo é limitado a $\min(RL_i, 700.00)$.
* **Impacto nas Metas:** A meta recalibrada calcula **sempre sobre o Saldo Apurado**.
* **Trava de Viabilidade:** Se a meta diária necessária ultrapassar **R$ 700,00/dia**, o app dispara alerta: *"⚠️ Inviável atingir em N pregões sob a regra de consistência de R$ 700/dia. Necessário estender os pregões"*.

### 1.3 Condição Tripla de Aprovação e Novo KPI de Dias Positivos
* O app **não encerra ou manda parar** apenas pelo saldo financeiro. A aprovação exige a tríade simultânea:
  1. $\text{Saldo Apurado} \ge \text{R\$ 1.400,00}$
  2. $\text{Dias Operados} \ge 5$
  3. $\text{Taxa de Dias Positivos (TDP)} \ge 60\%$
* **Diagnóstico de Status Completo:**
  * Se Saldo $\ge 1.400$, mas Dias $< 5$ ou TDP $< 60\%$: exibe aviso explicativo (ex: *"Meta financeira batida (+R$ 1.420), porém faltam 2 pregões operados e 1 dia positivo para cumprir as regras regulamentares"*).
* **Novo KPI:** **"Positivos Necessários nos Próximos Pregões"**:
  * Para meta mínima (5 dias): com 1 positivo em 2 dias, você precisa de **2 positivos nos próximos 3 pregões**.
  * Para horizonte alvo (10 dias): precisa de **5 positivos nos próximos 8 pregões** (para fechar 6 de 10 = 60%).

### 1.4 Persistência Robusta e Desacoplada do Drive
* **Canal Principal:** `LocalStorage` do navegador para carregamento instantâneo.
* **Segurança e Portabilidade:** Botão destacado **"Exportar Backup JSON"** e **"Importar Backup JSON"**.
* **Google Drive (Opcional):** Botão secundário de sincronização via File System Access API para quem estiver em desktop Chrome/Edge, sem travar o fluxo principal caso o usuário acesse de outro navegador ou mobile.

### 1.5 Gráfico Operacional Balanceado (Adequação de Escala)
* **Escala do Gráfico:** Foco na **trajetória operacional** (escala vertical de -R$ 500 a +R$ 1.600), garantindo que as barras diárias de $\pm$ R$ 200 a R$ 400 tenham excelente visibilidade e proporção visual em relação à linha do acumulado e ao teto de R$ 1.400.
* **Piso de Perda Total (-R$ 2.835,00):** Exibido em um **Card/Gauge dedicado de Drawdown** (Margem Livre restante), com toggle opcional no gráfico para "Exibir Piso no Gráfico".

### 1.6 Regra do Piso e Ferramentas Pré-Pregão
* **Piso:** Modelo padrão com Drawdown Máximo Total Fixo de **R$ 2.835,00** (capital real da Avaliação com Margem Turbinada), com chave para Trailing nas configurações caso necessário.
* **Checklist Pré-Pregão:** Painel expansível com 4 itens de blindagem:
  1. [ ] Mão padrão de **2 contratos** (sem preço médio desordenado).
  2. [ ] Janela rígida: **09h05 às 12h00** (atenção redobrada às 10h00).
  3. [ ] Calendário econômico checado (notícias dos EUA 9h30/10h00).
  4. [ ] Disjuntor financeiro do dia definido: **-R$ 200 a -R$ 240** (parada obrigatória).
* **Armazenamento Seguro:** Valores monetários manipulados internamente em **centavos** (inteiros) para evitar imprecisões de ponto flutuante. Schema versionado (`v1.0`) com prevenção de datas duplicadas.

---

## 2. Estrutura do Projeto (Vite + React + Tailwind + Recharts)

```
G:\Meu Drive\PESSOAL\EUROINVEST\
│
├── dados_avaliacao.json             # Backup inicial e persistente
├── plano_web_app_avaliacao.md       # Especificação técnica completa
│
└── app/                             # Aplicação pronta para deploy na Vercel
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx                  # Estado mestre, persistência e checklist
        ├── components/
        │   ├── Header.jsx           # Título, status da avaliação e botões Export/Import
        │   ├── PreMarketChecklist.jsx # Checklist de blindagem diária
        │   ├── KPICards.jsx         # Cards (Saldo Real vs Apurado, Metas, % Positivos, Piso)
        │   ├── PerformanceChart.jsx # Gráfico Recharts (Barras diárias + Linha acumulada + Teto)
        │   ├── TradeForm.jsx        # Formulário com validação de contratos e assimetria
        │   └── HistoryTable.jsx     # Histórico dos 10 pregões com análise estratégica
        ├── utils/
        │   └── calculations.js      # Motor puro de cálculo em centavos e regras da mesa
        └── data/
            └── initialData.js       # Pregões dos dias 12/11 e 13/11 já carregados
```

---

## 3. Ordem de Implementação

1. **Motor de Cálculo (`calculations.js`):**
   * Saldo Real e Saldo Apurado (teto de R$ 700/dia).
   * Percentual de Dias Positivos (TDP).
   * Meta Diária Recalibrada baseada no Saldo Apurado e limite de 10 pregões.
   * Validador da Condição Tripla de Aprovação.
   * Projeção de Dias Positivos Necessários (mínimo de 5 dias e horizonte de 10 dias).
2. **Formulário de Entrada:**
   * Campos: Data, Trades W/L, Contratos, Pontos, Bruto, Taxas, Análise Estratégica.
   * Validador de consistência matemática (pontos $\times$ 0,20 $\times$ contratos vs. bruto) com alerta de assimetria.
3. **Painel de KPIs & Checklist Pré-Pregão:**
   * Saldo Real vs. Apurado, Meta Diária, Barra de Progresso rumo aos R$ 1.400, Margem Livre até o Piso.
4. **Gráfico Combinado (Recharts):**
   * Barras verticais para P&L diário, Linha de P&L acumulado, Linha de Teto (+R$ 1.400) e toggle para escala completa com Piso.
5. **Persistência & Histórico:**
   * LocalStorage como padrão, botões de Exportar e Importar JSON com validação de schema e prevenção de duplicidade de datas.
