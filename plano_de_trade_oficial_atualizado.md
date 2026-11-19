# 🛡️ PLANO DE TRADE OFICIAL & MATRIZ DE CONFORMIDADE (V2.1)
**Ativo:** Mini Índice B3 (WIN) | **Trader:** Marcio Leite  
**Mesa Proprietária:** Euroinvest (Plano Junior - Meta: R$ 1.400 | Drawdown Máximo/Piso: R$ 2.835)

---

## 📋 1. DIRETRIZES OPERACIONAIS (Gabarito de Conformidade)
* **Setup Autorizado:** Price Action ancorado em VWAP e Volume Profile (POC, VAH, VAL, nós HVN/LVN).
* **Janela Operacional Estrita:** A partir de 09h15, com encerramento obrigatório quando o ATR(14) no 5M cair abaixo de **250 pontos** (aguardar 2 a 3 minutos na abertura do leilão das 10h00). O gatilho de encerramento é **dinâmico e soberano**: o ATR mede diretamente a condição de liquidez — se às 12h10 o ATR estiver acima de 250 pts, pode-se operar; se às 11h45 o ATR cair abaixo de 250 pts, encerra-se. A referência das 12h00 era apenas uma proxy deste critério e foi substituída.
* **Regime de Escalonamento Técnico (Defesa em Zona de Valor):**
  - Permitido o fracionamento de ordens (até o teto máximo de **10 contratos** acumulados) **exclusivamente** quando o preço estiver trabalhando em região de consolidação/congestão com suporte ou resistência comprovada em VWAP, POC ou nós HVN.
  - Em entradas direcionais isoladas (fora de consolidação), manter a mão base de 2 a 3 contratos.
* **Alvo Técnico & Stop Global da Operação:**
  - **Alvo Padrão:** 200 pontos em operações direcionais ou saída na extremidade oposta da consolidação/VWAP em operações de defesa escalonada.
  - **Stop Financeiro Global (Regra de Ouro):** O risco máximo por operação é calculado dinamicamente como um percentual fixo da **Margem Livre** (Saldo Acumulado + Piso de R$ 2.835), configurável no painel de Gestão de Risco (padrão: **5%**). A régua de lotes e o stop por contrato acompanham proporcionalmente — sem decisão manual. Exemplo:

    | Saldo Acumulado | Margem Livre | Risco/Trade @ 5% |
    |---|---|---|
    | R$ 0 (início) | R$ 2.835 | R$ 141,75 |
    | +R$ 500 | R$ 3.335 | R$ 166,75 |
    | +R$ 1.400 (meta) | R$ 4.235 | R$ 211,75 |

* **Disjuntor de Ganho:** R$ 150,00 a R$ 350,00 (desligar a plataforma ao atingir a faixa para proteger o dia positivo).
* **Disjuntor de Perda:** Equivalente ao teto de Risco/Trade definido no painel (% da Margem Livre). Desligar a plataforma imediatamente ao atingir o limite.

### 🚫 Regras de Bloqueio Operacional (Infrações Graves)
- **Proibido Preço Médio em Rompimento:** É terminantemente proibido escalonar ou adicionar contratos contra um rompimento claro de estrutura com expansão de volume (tendência direcional limpa fora da consolidação).
- **Proibido Excesso de Alavancagem:** Ultrapassar o teto máximo de **10 contratos** totais na posição ou assumir risco financeiro superior ao teto de % da Margem Livre definido no painel.
- **Proibido Operar com ATR Travado:** É terminantemente proibido operar quando o ATR(14) no 5M estiver abaixo de **250 pontos**. Este é o critério soberano de encerramento da sessão — substitui qualquer referência horária fixa.
- **Proibido Scalping Irregular:** Operações de tick curto menores que 20 pontos (infração de regulamento B3/Euroinvest).

---

## 📐 2. MATRIZ OBJETIVA DE PONTUAÇÃO PONDERADA (RUBRIC DE 0.0 A 10.0)
A auditoria parte de **Base 10.0 pontos**, aplicando as seguintes deduções objetivas:

1. **Janela Operacional (Peso Máximo: 2.5 pts):**
   - Todas as operações com ATR(14)/5M ≥ 250 pts, respeitando o leilão das 10h00: Dedução `0.0`.
   - Operou durante o leilão das 10h00 sem esperar 2 a 3 minutos: Dedução `-0.5 pt`.
   - Operou com ATR(14)/5M < 250 pts (mercado travado, independente do horário): Dedução `-2.0 pts`.
   - Sessão iniciada com ATR já travado desde a abertura (ausência total do critério): Dedução `-2.5 pts` (perda total da dimensão).

2. **Lote & Critério de Escalonamento (Peso Máximo: 2.5 pts):**
   - Lote dentro do limite (até 10 contratos em consolidação VWAP/POC ou até 3 contratos em trade direcional): Dedução `0.0`.
   - Escalonamento realizado fora de região clara de suporte/consolidação (sem ancoragem em VWAP/POC): Dedução `-1.5 pt`.
   - Ultrapassou o teto máximo de 10 contratos: Dedução `-2.5 pts` (perda total da dimensão).

3. **Gestão de Stop Global & Bloqueio de Rompimento (Peso Máximo: 2.5 pts):**
   - Stop global da posição respeitou o teto de Risco/Trade (% da Margem Livre do painel) e não houve adição contra rompimento: Dedução `0.0`.
   - Stop posicionado de forma desproporcional (expondo a conta acima do teto de % da Margem Livre em caso de violino): Dedução `-1.5 pt`.
   - Fez preço médio contra rompimento de estrutura com volume: Dedução `-2.5 pts` (perda total da dimensão).

4. **Disjuntores Diários & Overtrading (Peso Máximo: 2.5 pts):**
   - Parou ao atingir a faixa do disjuntor (ganho ou perda conforme painel) e encerrou o dia: Dedução `0.0`.
   - Continuou operando após atingir o disjuntor de ganho ou perda (overtrading): Dedução `-1.5 pt`.
   - Recuperou prejuízo para o zero/positivo e continuou operando, devolvendo capital: Dedução `-1.0 pt`.

> **TRAVA CRÍTICA DE INDISCIPLINA (FAIL-SAFE):** Se ocorrerem duas infrações graves simultâneas (ex: preço médio contra rompimento de estrutura + operação com ATR < 250 pts, ou rompimento do teto de 10 contratos + estouro do stop financeiro da Margem Livre), o Score Final é obrigatoriamente limitado ao teto máximo de **2.0**, independentemente das demais dimensões.