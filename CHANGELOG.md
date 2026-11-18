# 📋 Histórico de Versões — Terminal de Avaliação Euroinvest (Plano Junior)

---

## v2.2 — 2026-11-18 (Sessão: Parser Universal Multiplataforma — Suporte a Rocket Trader, Profit e Nelogica)

### 🚀 Resiliência Total de Importação de Relatórios (`web/calculations.js`, `web/index.html`, `web/test_calculations.js`)
- **Arquitetura Agnostica de Plataforma (Rocket Trader, Profit, Tryd):** Mecanismo de busca de colunas por normalização semântica (remoção de acentos, normalização de caracteres e lista extensiva de sinônimos de mercado).
- **Detecção Automática de Delimitadores:** Suporte transparente a ponto e vírgula (`;`), vírgula (`,`) e tabulações (`\t`).
- **Resolução de Datas Abreviadas:** Normalização automática de datas sem ano (ex: `"18/11 10:30:07"`), completando para o ano corrente e aceitando formatos `DD/MM/AAAA`, `DD/MM/AA`, `AAAA-MM-DD` e `DD-MM-AAAA`.
- **Inferência Resiliente de Status e Pontuação:** Caso o relatório não possua coluna explícita de status ou pontos, o motor calcula os pontos automaticamente pela variação de preço de entrada/saída (`Preço C` e `Preço V`) e infere o status pelo resultado financeiro.
- **Parser Financeiro Híbrido:** Extração de valores em reais (`R$`), percentuais, decimais com ponto ou vírgula, e notações compostas com pipe (`|`).
- **Destravamento do Pregão Corrente & Retificação de Zeros:** O pregão do dia de hoje (antes das 18h) nunca é bloqueado por travas de consolidação, permitindo subir novos relatórios ao longo do dia para atualizar os dados. Registros com valores zerados por erro prévio são automaticamente liberados para retificação.
- **Sincronização Integral dos 5 Pregões Auditados:** Inclusão oficial e definitiva no histórico canônico de todos os pregões operados: #1 12/11 (-R$ 62,09), #2 13/11 (+R$ 320,18), #3 16/11 (-R$ 83,94), #4 17/11 (+R$ 251,33) e #5 18/11 (+R$ 292,91 — Parcial ativo), consolidando o saldo acumulado em **+R$ 718,39** com consistência de 60,0%.
- **Recuperação Automática sem Necessidade de Reimportação:** Ao carregar a plataforma, o `loadData()` sincroniza automaticamente os 5 pregões na memória do navegador do trader.
- **Visualização Detalhada na Pré-visualização do CSV:** A pré-visualização do modal agora lista nominalmente cada pregão identificado com suas operações, pontos e resultado financeiro em verde/vermelho.
- **12 Testes Unitários 100% Aprovados:** Cobertura de relatórios legados e modernos.

---

## v2.1 — 2026-11-17 (Sessão: Matriz Objetiva de Pontuação Ponderada & Seletor de Escopo no Dossiê IA)

### 🚀 Auditoria Comportamental Determinística & Acessibilidade (`web/calculations.js`, `web/index.html`, `web/app.js`, `web/test_calculations.js`)
- **Matriz Objetiva de Pontuação Comportamental (Rubric 0.0 a 10.0):** Eliminação de subjetividade do auditor através de 4 dimensões com pesos matemáticos exatos e memória de cálculo obrigatória:
  1. *Janela Operacional (2.5 pts):* Penalidades para leilão das 10h (-0.5 pt), turno da tarde (-2.0 pts) ou sessão iniciada fora do horário (-2.5 pts).
  2. *Lote & Simetria (2.5 pts):* Penalidades para assimetria de contratos (-1.5 pt) ou alavancagem ≥ 4 cts (-2.5 pts).
  3. *Stop Técnico & Preço Médio (2.5 pts):* Penalidades para stop < 200 pts (-1.0 pt) ou preço médio contra consolidação (-2.5 pts).
  4. *Disjuntores & Overtrading (2.5 pts):* Penalidades para overtrading pós-disjuntor (-1.5 pt) ou devolução de capital pós-empate (-1.0 pt).
  - *Trava Crítica Fail-Safe:* Faltas graves duplas (ex: preço médio à tarde) limitam o teto do score a 2.0.
- **Seletor de Escopo no Cabeçalho `[ ✨ Dossiê IA ]`:** O modal do cabeçalho agora possui dropdown imediato que permite alternar entre o *Dossiê Consolidado de Toda a Avaliação* e o *Dossiê Específico de Cada Pregão* (#1 12/11, #2 13/11, etc.), com botão de download do `.md` em 1 clique.
- **Matriz Formal no Modal do Plano de Trade:** Acesso transparente a todos os critérios e deduções no botão `[ 📋 Plano de Trade ]`.

---

## v2.0 — 2026-11-17 (Sessão: Validação Visual de Print no Dossiê IA, Remoção de Formulário Obsoleto e Tabela Full-Width)

### 🚀 Layout Amplo & Rigor de Auditoria Visual (`web/calculations.js`, `web/index.html`, `web/app.js`, `web/test_calculations.js`)
- **Checagem Obrigatória de Integridade do Print (Etapa 0 no MD):** Instrução imperativa para o Claude/Gemini inspecionar a imagem do gráfico antes de avaliar a sessão, validando:
  1. *Data do gráfico* (deve coincidir exatamente com o dia do pregão auditado);
  2. *Ativo operado* (deve ser estritamente Mini Índice B3 - WIN/WINFUT);
  3. *Tempo gráfico* (visível e condizente com Price Action / VWAP, ex: 5 min, 2 min ou Renko).
  - Caso haja divergência de dia, ativo trocado (ex: Dólar ou Ações) ou imagem ilegível, a IA emite o veredito `"PRINT INCOMPATÍVEL / RETIFICAR IMAGEM"` com score 0.0 provisório e diretriz orientando o trader a anexar o print correto.
- **Remoção Completa do Formulário Manual "Lançamento do Pregão":** Eliminação do card redundante de preenchimento manual de 5 colunas que comprimia a interface. O fluxo passa a ser 100% orientado ao relatório CSV do Profit.
- **Tabela de Histórico dos Pregões em Largura Total (Full Width):** Expansão da tabela de histórico para 100% da largura útil da tela (12 colunas), proporcionando visualização limpa, arejada e sem necessidade de rolagem lateral comprimida para todas as 12 métricas e ações.
- **11 Testes Unitários 100% Aprovados:** Validação rigorosa dos cálculos, regras e integridade dos prompts.

---

## v1.9 — 2026-11-17 (Sessão: Plano de Trade Oficial, Dossiê .MD de Auditoria IA e Score Comportamental)

### 🚀 Plano de Trade & Auditoria Comportamental com IA (`web/calculations.js`, `web/index.html`, `web/app.js`, `web/test_calculations.js`)
- **Plano de Trade Oficial Integrado (`PLANO_DE_TRADE_PADRAO`):** Formalização técnica dos parâmetros operacionais para a mesa da Euroinvest (Setup VWAP/Volume Profile, Janela 09h15-12h00, Alvo padrão de 200 pts, Stop mínimo técnico de 200 pts, Lote base de 2 cts [máx 3 cts], Disjuntores diários e Regras de Bloqueio Rígido). Modal interativo acessível pelo botão `[ 📋 Plano de Trade ]`.
- **Dossiê Estruturado para Auditoria IA (`gerarPromptAuditoriaMD`):** Geração e download em 1 clique de arquivo `.md` completo (`auditoria_pregao_YYYY-MM-DD.md`) contendo as diretrizes do Plano de Trade, dados quantitativos do pregão e instruções detalhadas para o trader submeter ao Claude ou Gemini junto com o print do gráfico.
- **Registro e Parser do Parecer da IA (`parseRetornoAuditoriaIA`):** Interface para colar a resposta do LLM com extração automática do **Score Comportamental (0 a 10)**, Veredito, Acertos, Desvios e Diretriz Corretiva.
- **Score Comportamental no Gráfico (3ª Linha do Eixo X):** O gráfico agora correlaciona diretamente o resultado financeiro com a disciplina do operador através de rótulos de 3 linhas (`Pregão X / DD/MM / Score: Y.Y`), permitindo visualizar quando um ganho decorreu de sorte/indisciplina versus perda com execução técnica impecável.
- **Coluna 'Score IA' no Histórico de Pregões:** Tabela enriquecida com badges visuais de pontuação (`🟢 ≥ 8.5`, `🟡 ≥ 6.0`, `🔴 < 6.0`) e botão de ação rápida `[ 🤖 Auditar ]`.
- **Manutenção Sóbria do Banner de Lembrete:** Preservação da regra condicional inteligente que ativa o lembrete apenas em fechamentos semanais e finais de semana para garantir limpeza visual diária.
- **Validação com 11 Suítes de Testes Unitários:** 100% de cobertura nos cálculos, regras de consistência, assimetria de lote, persistência e parser de IA.

---

## v1.8 — 2026-11-17 (Sessão: Rótulos com Datas no Eixo X, Importação Cumulativa e Trava de Imutabilidade Pós-B3)

### 🚀 Gráfico, Integridade de Histórico & Imutabilidade (`web/calculations.js`, `web/app.js`, `web/test_calculations.js`)
- **Datas dos Pregões no Eixo X do Gráfico:** O eixo horizontal do gráfico de evolução agora exibe rótulos multi-linha com o número do pregão e a data correspondente logo abaixo (`Pregão 1 / 12/11`, `Pregão 2 / 13/11`, etc.), mantendo `—` para pregões futuros.
- **Importação CSV Estritamente Cumulativa (Upsert Seguro):** Correção definitiva da importação de relatórios. Subir um arquivo de apenas 1 dia ou período parcial agora realiza um merge incremental, preservando todos os pregões já existentes no banco local sem risco de perda ou apagamento acidental.
- **Trava de Imutabilidade Pós-Fechamento da B3 (`isPregaoConsolidado`):** Qualquer pregão com data anterior ou registrado após o fechamento da B3 (18:00) torna-se oficialmente consolidado e imutável (`consolidado: true`), bloqueando exclusões, edições ou sobrescritas por novos arquivos.
- **Identificação Visual na Tabela:** Pregões consolidados exibem ícone de cadeado (`🔒 Consolidado / Fechado`) e têm os botões de exclusão e edição desativados por segurança.
- **Recuperação Automática do Histórico Oficial:** Inicialização e carregamento resilientes que garantem a presença perene dos pregões auditados (#1 em 12/11 e #2 em 13/11).

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
