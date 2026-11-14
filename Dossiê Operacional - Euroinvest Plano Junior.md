# Dossiê Operacional — Mesa Proprietária Euroinvest (Plano Junior)

**Trader:** Marcio Leite  
**Corretora / Mesa:** Euroinvest (Regulamento Planos B3 — vigência 01/02/2026, revisão 26/10/2026)  
**Pacote Contratado:** Plano Junior + Reset + Margem Turbinada + Saque Diário + Plataforma Rocket (74% OFF — R$ 174,00 pagos)  
**Ativo Operado:** Mini Índice (WIN)  
**Data de Atualização:** 13/11/2026  

### Links Oficiais e Referências
* **Regulamento Planos B3 (revisão de 26/10/2026):** https://euroinvest.com.br/regulamento-b3/
* **Página de Regulamentos e FAQ (Plano de Performance):** https://euroinvest.com.br/regulamento/

---

## 1. Estrutura e Regras do Plano Junior (Euroinvest)

### Etapas da Mesa
1. **Avaliação:** Atingir a meta líquida respeitando prazo, dias mínimos e consistência.
2. **Simulador Remunerado:** Atingir o gatilho de migração sob regras mais rígidas de perda diária.
3. **Conta Patrocinada (Mesa Real):** Atingir o valor mínimo acumulado para solicitar repasse (85% de repasse, 20% de IR descontado e emissão obrigatória de NF em até 180 dias).

### Parâmetros Financeiros e Operacionais do Plano Junior
| Parâmetro | Avaliação (Seu Pacote) | Simulador Remunerado | Conta Patrocinada |
| :--- | :--- | :--- | :--- |
| **Ativos Permitidos** | WIN e WDO | WIN e WDO | WIN e WDO |
| **Limite Máximo de Contratos** | 10 contratos | 10 contratos | 10 contratos |
| **Perda Total (Capital Real)** | **R$ 2.835,00** (R$ 1.890 + R$ 945 Margem Turbinada) | **R$ 1.890,00** (perde a margem extra) | **R$ 1.890,00** (ou R$ 2.835 se incorporar gatilho) |
| **Perda Diária Máxima** | Não há | **25% (R$ 472,50)** | **25% (R$ 472,50)** |
| **Meta / Gatilho / Mín. Saque** | **R$ 1.400,00** (meta) | **R$ 945,00** (gatilho) | **R$ 560,00** (mínimo p/ repasse) |
| **Teto de Consistência Diária** | **R$ 700,00/dia** (50% da meta; excedente descartado) | 50% do gatilho (R$ 472,50/dia) | Não se aplica |
| **Plataforma (Rocket Trader)** | Grátis no 1º mês (após: R$ 69/mês) | R$ 69/mês | Gratuita |
| **Custo Operacional (WIN)** | **R$ 0,70/contrato** (R$ 0,35 por ponta + emolumentos B3) | R$ 0,70/contrato | R$ 0,70/contrato |

### Regras Críticas de Aprovação e Restrições
* **Dias Mínimos e Consistência:** Mínimo de **5 dias operados** e encerramento com **60% ou mais de dias positivos**.
* **Regra de Scalp Mínimo:** Operações no WIN com variação de **20 pontos ou menos** são desconsideradas se ultrapassarem **20% do total de trades do dia**.
* **Inatividade + Drawdown:** 90% da perda total acumulada somados a 2 pregões sem operar eliminam a conta. Reativação por bloqueio custa R$ 50 (suspensão programada até 90 dias é gratuita).
* **Horário de Zeragem:** Encerrar todas as posições antes das **17h30**.
* **Pós-Meta:** Não operar após bater a meta até a validação do suporte (até 1 dia útil).
* **Saque Diário:** Liberado apenas após o **1º ciclo de repasse de 30 dias** na Conta Patrocinada; exige saldo positivo, mínimo de 6 pregões operados (pelo menos 3 positivos), saque mínimo de R$ 200, solicitação até 14h e envio de NF (não processado às sextas-feiras).
* **Reset:** Uso único, válido apenas na Avaliação, e não renova os 30 dias gratuitos da plataforma.
* **Proibições:** Hedge entre contas, Copy Trade e robôs fora da Nelogica (Rocket não possui automação). Limite de até 15 contas em teste e 10 Contas Patrocinadas simultâneas por CPF.

### Plano de Performance (Crescimento na Mesa Real)
* **O que consta no site (FAQ *"O que é a Margem Adicional?"* em https://euroinvest.com.br/regulamento/ e bloco *"Evolução no ritmo certo"*):** Prevê que, com resultados consistentes na Conta Patrocinada, o trader pode solicitar ao suporte **aumento de contratos e de margem operacional (50% ou 100%)**, além da opção de incorporar o gatilho de R$ 945 à margem na transição para a Conta Patrocinada.
* **Ponto de atenção:** O Regulamento B3 corrido (https://euroinvest.com.br/regulamento-b3/) não traz tabela automática com gatilhos fechados de escalonamento. **Ação recomendada:** Salvar print do FAQ/site com data e solicitar por escrito ao suporte (+55 21 99131-2013) os critérios objetivos de tempo e consistência para o upgrade, além da confirmação escrita da validade da Margem Turbinada na Rocket.

---

## 2. Perfil Operacional e Gestão de Risco Calibrada

* **Setup:** Price Action puro ancorado em **VWAP e Volume Profile** (POC, VAH, VAL, HVN/LVN), operando scalps com alvo de **200 pontos** e meta diária de **300 pontos**.
* **Janela Operacional:** **09h15 às 12h00** (evitando período da tarde de baixa liquidez e monitorando indicadores econômicos dos EUA às 9h30, 10h30 e 11h00).
* **Dimensionamento de Mão:** Entrada padrão com **2 contratos** de WIN, podendo escalar até **6 contratos** via preço médio dentro de zonas de consolidação.
* **Filosofia de Stop (Ajustada à Volatilidade do WIN):**
  * **Stop Técnico na Estrutura:** Posicionado atrás dos nós de volume (HVN) ou extremidades da área de valor (VAH/VAL), evitando stops curtos fixos que são violinados pelo ruído normal do WIN. Zerar imediatamente se o preço romper a zona de liquidez (LVN) com volume e invalidar a tese.
  * **Disjuntor Financeiro Diário:** Encerrar o pregão se uma estrutura estopar com mão carregada (ex.: -R$ 150 a -R$ 240 na Avaliação; teto rígido de **R$ 300 a R$ 350** no Simulador Remunerado para nunca tocar o limite automático de R$ 472,50).

### Matemática do Setup no WIN (Custo de ~R$ 0,70 a R$ 0,735/contrato ida e volta)
| Cenário no Dia | Pontos | Bruto (R$) | Taxas Estimadas | Líquido (R$) | Impacto na Meta (R$ 1.400) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mão base (2 cts)** | 300 pts | R$ 120,00 | -R$ 1,47 | **R$ 118,53** | 12 pregões para a meta |
| **Médio parcial (4 cts)** | 300 pts | R$ 240,00 | -R$ 2,94 | **R$ 237,06** | 6 pregões para a meta |
| **Mão cheia (6 cts)** | 300 pts | R$ 360,00 | -R$ 4,41 | **R$ 355,59** | 4 pregões (metade do teto de R$ 700/dia) |

---

## 3. Auditoria de Desempenho da Avaliação (12/11 e 13/11/2026)

### Placar Consolidado Atual
| Indicador | Dia 1 (12/11) | Dia 2 (13/11) | Consolidado Atual | Exigência (Plano Junior) |
| :--- | :--- | :--- | :--- | :--- |
| **Operações (W / L)** | 5 (1W / 4L) | 6 (5W / 1L) | **11 trades (6W / 5L — 54,5%)** | — |
| **Pontos Líquidos** | +15,0 pts | +822,5 pts | **+837,5 pts** | — |
| **Resultado Bruto** | -R$ 54,00 | +R$ 329,00 | **+R$ 275,00** | — |
| **Taxas Operacionais** | -R$ 8,09 | -R$ 8,82 | **-R$ 16,91** | Descontadas direto no P&L |
| **Resultado Líquido** | **-R$ 62,09** | **+R$ 320,18** | **+R$ 258,09** | Meta: **R$ 1.400,00** (faltam **R$ 1.141,91**) |
| **Margem Operacional** | R$ 2.772,91 | R$ 3.093,09 | **R$ 3.093,09** | Inicial: R$ 2.835,00 (+R$ 258,09 de folga) |
| **Dias Operados / Positivos** | 1 dia (0%) | 1 dia (100%) | **2 dias (1 positivo = 50,0%)** | Mínimo **5 dias** e **≥ 60% positivos** |

---

### Detalhamento — Dia 1 (12/11/2026)
* **Janela Operada:** 13h46 às 17h02 (período da tarde, fora da janela recomendada).
* **Resumo:** 5 operações (1W / 4L — 20% de acerto) | **+15,0 pontos** | Bruto: -R$ 54,00 | Taxas: -R$ 8,09 | **Líquido: -R$ 62,09**.
* **Regra de Scalp ≤ 20 pts:** 1 de 5 trades (20,0%) — no limite exato, sem infração.

| # | Abertura | Fechamento | Duração | Lote | Status | Pontos | Bruto (R$) | Taxas (R$) | Líquido (R$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 13:46:36 | 13:56:58 | 10m 21s | 1 ct | Perdedora | 0,0 | R$ 0,00 | -R$ 0,74 | **-R$ 0,74** |
| **2** | 14:06:58 | 14:13:48 | 6m 49s | 4 cts | Perdedora | -150,0 | -R$ 120,00 | -R$ 2,94 | **-R$ 122,94** |
| **3** | 14:37:35 | 15:01:02 | 23m 27s | 2 cts | Vencedora | +310,0 | +R$ 124,00 | -R$ 1,47 | **+R$ 122,53** |
| **4** | 16:47:08 | 16:49:37 | 2m 29s | 2 cts | Perdedora | -50,0 | -R$ 20,00 | -R$ 1,47 | **-R$ 21,47** |
| **5** | 16:49:37 | 17:02:27 | 12m 49s | 2 cts | Perdedora | -95,0 | -R$ 38,00 | -R$ 1,47 | **-R$ 39,47** |

**Lições do Dia 1:**
1. **Assimetria de lote:** O gain de +310 pts com 2 cts (+R$ 122,53) apenas empatou o loss anterior de -150 pts com 4 cts (-R$ 122,94).
2. **Armadilha do fim de tarde:** Até 15h01 o dia estava no zero a zero (-R$ 1,15); todo o prejuízo líquido (-R$ 60,94) ocorreu entre 16h47 e 17h02, com reentrada imediata no mesmo segundo de um stop (`16:49:37`).

---

### Detalhamento — Dia 2 (13/11/2026)
* **Janela Operada:** 09h05 às 10h12 (1h07 de tela).
* **Resumo:** 6 operações (5W / 1L — 83,3% de acerto) | **+822,5 pontos** | Bruto: +R$ 329,00 | Taxas: -R$ 8,82 | **Líquido: +R$ 320,18**.
* **Métricas de Qualidade:** Ganho médio **+R$ 67,93 (+173,5 pts)** vs. Perda média **-R$ 19,47 (-45,0 pts)** | **Payoff: 3,49x** | **Fator de Lucro: 17,44** | **0 infrações** na regra dos 20 pontos.

| # | Abertura | Fechamento | Duração | Lote | Status | Pontos | Bruto (R$) | Taxas (R$) | Líquido (R$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 09:05:29 | 09:05:42 | 13s | 2 cts | Vencedora | +192,5 | +R$ 77,00 | -R$ 1,47 | **+R$ 75,53** |
| **2** | 09:08:30 | 09:10:05 | 1m 34s | 2 cts | Vencedora | +115,0 | +R$ 46,00 | -R$ 1,47 | **+R$ 44,53** |
| **3** | 09:19:40 | 09:27:17 | 7m 36s | 2 cts | Vencedora | +192,5 | +R$ 77,00 | -R$ 1,47 | **+R$ 75,53** |
| **4** | 09:40:00 | 09:44:46 | 4m 46s | 2 cts | Vencedora | +117,5 | +R$ 47,00 | -R$ 1,47 | **+R$ 45,53** |
| **5** | 10:00:00 | 10:01:39 | 1m 39s | 2 cts | Perdedora | -45,0 | -R$ 18,00 | -R$ 1,47 | **-R$ 19,47** |
| **6** | 10:02:29 | 10:12:47 | 10m 18s | 2 cts | Vencedora | +250,0 | +R$ 100,00 | -R$ 1,47 | **+R$ 98,53** |

**Destaques do Dia 2:**
1. Operou 100% com a mão mínima de 2 contratos, sem necessidade de preço médio.
2. Único loss ocorreu no minuto exato da abertura do mercado à vista (`10:00:00`), sendo encerrado rapidamente quando a leitura falhou, seguido de entrada limpa às `10:02:29` (+250 pts) e encerramento imediato da plataforma.

---

## 4. Plano de Fechamento da Avaliação (Meta: R$ 1.141,91 Restantes + ≥ 60% Dias Positivos)

Como a taxa atual está em **50,0% (1 dia positivo em 2 operados)**, o foco absoluto nos próximos pregões é **proteger o fechamento no verde** e evitar qualquer operação fora da janela da manhã.

| Total de Pregões | Novos Dias | Mínimo de Dias Positivos | Novos Dias Positivos Exigidos | Novos Negativos Tolerados | Taxa Final Mínima | Média Líquida/Dia (se todos positivos) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5 dias** (mínimo) | +3 dias | **3 de 5** | +2 positivos | +1 negativo | **60,0%** | **R$ 380,64 / dia** |
| **6 dias** | +4 dias | **4 de 6** | +3 positivos | +1 negativo | **66,7%** | **R$ 285,48 / dia** |
| **7 dias** | +5 dias | **5 de 7** | +4 positivos | +1 negativo | **71,4%** | **R$ 228,38 / dia** |
| **8 dias** | +6 dias | **5 de 8** | +4 positivos | +2 negativos | **62,5%** | **R$ 190,32 / dia** |
| **10 dias** | +8 dias | **6 de 10** | +5 positivos | +3 negativos | **60,0%** | **R$ 142,74 / dia** |

### Checklist Diário de Execução
1. **Horário rígido:** Operar exclusivamente entre **09h05/09h15 e 12h00**; evitar entradas novas exatamente às **10h00** (aguardar 2 a 3 minutos da abertura à vista) e checar calendário econômico dos EUA antes do pregão.
2. **Proteção dos 60%:** Fechou a manhã com **R$ 150 a R$ 350 líquidos**? Encerrar o dia e garantir o pregão positivo no extrato.
3. **Disciplina de parada:** Se a estrutura técnica estopar e o dia atingir o disjuntor financeiro (-R$ 150 a -R$ 240), desligar a plataforma e preservar o saldo acumulado para o pregão seguinte.