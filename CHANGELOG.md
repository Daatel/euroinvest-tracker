# 📋 Histórico de Versões — Terminal de Avaliação Euroinvest (Plano Junior)

---

## v1.7 — 2026-11-14 (Sessão: Painel Superior de Gestão Estratégica de Risco e Régua de Volatilidade)

### 🚀 Gestão de Risco por Trade & Régua de Volatilidade (`web/calculations.js`, `web/index.html`, `web/app.js`)
- **Painel Superior de Gestão Estratégica de Risco:** Inserido na posição de destaque entre o Cabeçalho e o Radar de Eventos, exibindo o teto financeiro por trade e a régua técnica contra violinos de volatilidade.
- **Cálculo Dinâmico de Risco (`calculateRiskTiers`):** Parametrização ajustável em tela do percentual de risco por operação (padrão: 5,0% = R$ 141,75 sobre o piso de R$ 2.835,00) e da mão base (2 contratos).
- **Régua de Stop Técnico no WIN com Alerta de Violino (< 200 pts):**
  - **2 contratos (Base):** 354 pts (`🟢 Estrutura Segura`).
  - **3 contratos:** 236 pts (`🟢 Viável`).
  - **4 contratos (Médio):** 177 pts (`⚠️ Frágil: Stop < 200 pts`).
  - **6 contratos (Mão Cheia):** 118 pts (`🔴 Inviável: Risco de Violino`).
- **Diretriz Técnica Institucional:** Sinalização explícita de que stops inferiores a 200 pontos no WIN sofrem risco crônico de violino por ruído de HFT, recomendando mão máxima de até 3 contratos sob o teto de 5%.

---

## v1.6 — 2026-11-14 (Sessão: Importador de CSV do Profit, Gestão de Dias Sem Operação e Lembrete)

### 🚀 Importador de Relatório & Métricas Neutras (`web/calculations.js`, `web/index.html`, `web/app.js`)
- **Parser de Operações do Profit (`parseProfitCSV`):** Leitura direta de relatórios exportados pela Nelogica/Profit (separadores `;` ou `,`), consolidando automaticamente trades intradia em pregões com cálculo fiel de pontos, bruto, taxas, líquido e contratos.
- **Detecção Automática de Pregões Sem Operação:** Identificação de dias úteis sem trades no intervalo do relatório, assumindo-os automaticamente como sem operação sem bloquear o fluxo com perguntas desnecessárias.
- **Diagnóstico Estratégico Sóbrio:** Inclusão direta e impessoal da métrica no painel estratégico (`X pregões sem operação no período.`), sem afetar a contagem matemática dos 10 pregões operados nem a taxa de consistência.
- **Modal de Importação de CSV:** Botão `[ Importar CSV ]` no cabeçalho com drag-and-drop de arquivos `.csv`, colagem de texto e pré-visualização antes da gravação no terminal.
- **Alerta de Lembrete no Topo:** Banner informativo ao final do pregão/semana lembrando o trader de importar o relatório da corretora, com botão de ação direta e opção de dispensar.

---

## v1.5 — 2026-11-14 (Sessão: Calendário Econômico Oficial Investing.com e Navegação por Pregão)

### 🚀 Radar de Eventos & Usabilidade (`web/index.html`, `web/app.js`)
- **Calendário Econômico Oficial Investing.com:** Mapeamento completo dos eventos de 3 estrelas (EUA & BR) para a semana de 16/11 a 20/11:
  - **16/11 (Segunda):** IBC-Br (09:00, Ant 0,30%) e Discurso de Warsh/Fed (14:00).
  - **17/11 (Terça):** Núcleo de Vendas no Varejo (10:30, Proj 0,4%, Ant 0,9%) e Vendas no Varejo (10:30, Proj 0,0%, Ant 0,8%).
  - **18/11 (Quarta):** Estoques de Petróleo Bruto (12:30, Ant 4,657M) e Atas do FOMC (16:00).
  - **19/11 (Quinta):** Pedidos por Seguro-Desemprego (10:30, Ant 200K), Atividade Industrial Fed Filadélfia (10:30, Ant 20,9) e Balanço Patrimonial do Fed (18:30, Ant 6.759B).
  - **20/11 (Sexta):** Feriado Nacional — Dia da Consciência Negra (B3 Fechada, pregão suspenso).
- **Navegação Diária no Radar:** Implementação de abas de seleção rápida (`16/11`, `17/11`, `18/11`, `19/11`, `20/11`) com autodeterminação do pregão atual/seguinte.
- **Limpeza Visual e Eliminação de Redundâncias:** Remoção dos badges repetitivos de "3★ Alto" em cada card, mantendo os dados objetivos de horário, país, moeda, indicador, projeção e número anterior.

---

## v1.4 — 2026-11-14 (Sessão: MVP PropFirmTradeCoach — Radar 3★, Parecer de Mesa e Dossiê IA)

### 🚀 MVP PropFirmTradeCoach (`web/index.html`, `web/app.js`, `dados_avaliacao.json`)
- **Radar de Notícias 3★ (EUA & BR):** Substituição dos checkboxes estáticos por um painel silencioso e puramente informativo com os eventos econômicos de alto impacto (CPI/Payroll, Abertura B3, Abertura NYSE, FOMC/Copom), sem instruções prescritivas.
- **Parecer Operacional Institucional (Modal do Coach):** Botão interativo no histórico (`#1`, `#2`) que exibe a auditoria sóbria e impessoal da sessão (Veredito, Síntese Executiva, Acertos Técnicos, Ineficiências e Diretriz para a próxima sessão).
- **Gestão Local de Imagens:** Criação da pasta local `prints/` no Google Drive para armazenamento direto de capturas de tela sem estourar o limite de 5MB do navegador.
- **Exportação de Dossiê para IA:** Botão no cabeçalho que compila todas as métricas acumuladas, tabela completa de pregões e reflexões do trader em um prompt estruturado pronto para auditoria longitudinal no Claude ou Gemini.

---

## v1.3 — 2026-11-14 (Sessão: Blindagem de Privacidade e Configuração Explícita Vercel)

### 🚀 Segurança, Privacidade & Vercel (`web/app.js`, `web/calculations.js`, `vercel.json`)
- **Proteção de Dados Pessoais:** Remoção dos trades reais fixados no código-fonte público (`app.js`). O aplicativo agora inicializa com estado limpo, permitindo que o trader carregue sua base auditada através do botão "Restaurar" a partir do arquivo local `dados_avaliacao.json`.
- **Parametrização Dinâmica do Objeto `meta`:** `calculations.js` agora lê e prioriza dinamicamente as metas, pisos e parâmetros regulamentares importados do JSON (`metaFinanceira`, `pisoDrawdown`, `tetoConsistenciaDiaria`, `maxPregões`).
- **Configuração Canônica Vercel (`vercel.json`):** Declaração explícita de `buildCommand: null`, `installCommand: null`, `framework: null`, `outputDirectory: "web"` e `cleanUrls: true` para garantir build estático puro sem interferência de scripts serverless.

---

## v1.2 — 2026-11-14 (Sessão: Resolução de Conflito Serverless Vercel & Deploy 100% Estático)

### 🚀 Infraestrutura de Deploy Vercel (`.vercelignore`, `vercel.json`)
- **Eliminação do Erro 500 (FUNCTION_INVOCATION_FAILED):** O Vercel estava interpretando o script de servidor local (`server.mjs`) como uma Serverless Function em Node.js com `server.listen()`.
- **Criação do `.vercelignore`:** Ignora arquivos utilitários locais (`server.mjs`, `iniciar_terminal.bat`, documentações) no build do Vercel.
- **Configuração de Output Directory Estático:** `vercel.json` configurado com `"framework": null` e `"outputDirectory": "web"`, garantindo que o Vercel sirva o projeto diretamente pelo CDN estático global sem provisionar funções serverless.

---

## v1.1 — 2026-11-14 (Sessão: Otimização de Deploy Vercel & Compatibilidade Estática)

### 🚀 Infraestrutura de Deploy Vercel (`package.json`, `vercel.json`, `index.html`)
- **Resolução do Erro Rollup/Vite:** Remoção das configurações residuais de build do Vite na pasta `app/` que procuravam um `index.html` não localizado.
- **Estrutura Estática Universal:** `index.html`, `app.js` e `calculations.js` espelhados tanto na raiz quanto na pasta `app/` e `web/`, garantindo que o deploy na Vercel funcione com sucesso imediato em qualquer diretório base (Root ou Subdiretório).
- **Scripts de Build Instantâneo:** Configuração de script de build leve sem dependências pesadas de compilação, permitindo publicação instantânea em menos de 5 segundos no Edge da Vercel.

---

## v1.0 — 2026-11-13 (Sessão: Criação do Terminal Web de Acompanhamento da Mesa Proprietária)

### 🚀 Terminal Web & Dashboard Financeiro (`web/index.html`, `web/app.js`, `web/calculations.js`)
- **Motor Estatístico e Regulamentar (`web/calculations.js`):** Implementação da aritmética de precisão em centavos inteiros para apuração da mesa:
  - Cálculo do **Saldo Real** e do **Saldo Apurado** (limitando cada ganho diário ao teto de consistência de R$ 700,00 da Euroinvest).
  - Recálculo dinâmico da **Meta Diária** para fechamento em até 10 pregões com alerta de viabilidade matemática.
  - Controle de **Taxa de Dias Positivos (% TDP)** com exigência mínima de ≥ 60% e projeção de vitórias necessárias para 5 e 10 pregões.
  - Validação da **Condição Tripla de Aprovação** (Saldo Apurado ≥ R$ 1.400,00, Mínimo de 5 dias operados e ≥ 60% de dias positivos).
  - Detecção inteligente de **Assimetria de Lotes** entre trades do mesmo pregão (`Pontos × R$ 0,20 × Contratos ≠ Bruto`).
