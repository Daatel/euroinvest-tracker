# 📋 Histórico de Versões — Terminal de Avaliação Euroinvest (Plano Junior)

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
- **Dashboard Visual & Gráfico Combinado (`web/index.html`, `web/app.js`):**
  - Tema executivo Dark Mode financeiro com Tailwind CSS e ícones Lucide.
  - Gráfico interativo combinado (Chart.js) com barras verticais para P&L diário (+ verde, - vermelho), linha de P&L acumulado em azul celeste, linha pontilhada de Teto da Meta (+R$ 1.400) e alternador de escala operacional vs. escala total com Piso (-R$ 2.835).
  - Cards executivos: Saldo Real vs. Apurado, Meta Diária Recalibrada, % Dias Positivos com badge de conformidade, Margem Livre até o Piso de Drawdown e Win Rate de operações.
  - Checklist diário de blindagem pré-pregão (mão base de 2 cts, janela rígida 09h05-12h00, notícias dos EUA e disjuntor de -R$ 200 a -R$ 240).
  - Formulário de lançamento diário conectado ao Relatório de Performance com preview em tempo real e aviso de assimetria.
  - Tabela histórica completa com modal para visualização da Análise Estratégica e lições de cada dia.

### 🗄️ Persistência de Dados & Infraestrutura (`dados_avaliacao.json`, `vercel.json`, `server.mjs`, `iniciar_terminal.bat`)
- **Persistência Híbrida Desacoplada:** `LocalStorage` no navegador com carregamento instantâneo + Botões nativos de exportação/importação de backup JSON + Integração opcional via File System Access API para salvar direto no Google Drive.
- **Configuração de Deploy Vercel (`vercel.json`):** Roteamento estático pronto para deploy na Vercel com 0 build time e custo zero.
- **Servidor Local e Atalho de Inicialização (`server.mjs`, `iniciar_terminal.bat`):** Servidor HTTP leve em Node.js nativo para abrir localmente no navegador padrão com 1 duplo-clique.
