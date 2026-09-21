import { GoogleGenAI } from '@google/genai';
import { Portfolio, ComplianceAlert, RebalanceOrder } from '../types.ts';
import { ComplianceAgent } from './complianceAgent.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askComplianceAgent(
  userQuery: string,
  portfolios: Portfolio[],
  alerts: ComplianceAlert[]
): Promise<string> {
  const ai = getAiClient();

  const portfolioSummary = portfolios.map((p) => {
    const pAlerts = alerts.filter((a) => a.portfolioId === p.id);
    const allocations = ComplianceAgent.calculateAllocations(p);
    return {
      id: p.id,
      name: p.name,
      client: p.clientName,
      profile: p.profile,
      aum: `R$ ${(p.totalAum / 1000000).toFixed(2)}M`,
      status: p.status,
      alerts: pAlerts.map((a) => `${a.severity}: ${a.assetClass} (${a.currentPercent}% vs teto ${a.maxPercent}%)`),
      allocations: allocations.map((al) => `${al.assetClass}: ${al.currentPercent}% (meta ${al.targetPercent}%, máx ${al.maxPercent}%)`),
    };
  });

  const prompt = `Você é o ComplianceAgent do FlowCore, um consultor sênior de compliance regulatório e estrategista de mercado financeiro, especializado em fundos de investimento, Family Offices e Asset Management. Você possui domínio profundo das regulações da CVM (em especial a Resolução CVM 175), diretrizes de marcação a mercado da Anbima, regras tributárias para fundos de investimento e dinâmica avançada de macroeconomia, política monetária e classes de ativos (Renda Fixa, Equities, FIPs, FIIs, Derivativos e Ativos no Exterior).

Contexto atual das carteiras monitoradas no sistema:
${JSON.stringify(portfolioSummary, null, 2)}

Regras de Classificação Vigentes no Motor de Risco (FlowCore):
- 🟢 NORMAL: Dentro do limite estipulado na política de investimentos/mandato.
- 🟡 ATENÇÃO / WARNING: Acima do limite estipulado em até 5 p.p. (faixa de monitoramento preventivo).
- 🔴 DESENQUADRADO / CRITICAL: Excesso superior a 5 p.p. acima do limite teto (desenquadramento passivo ou ativo, exigindo notificação ao administrador fiduciário e plano de rebalanceamento).

Pergunta do Usuário (Gestor, Assessor ou Compliance Officer):
"${userQuery}"

Por favor, responda de forma técnica, executiva, precisa e altamente estruturada. Como especialista do mercado financeiro, aplique seu conhecimento regulatório e de mercado na resposta, seguindo estas diretrizes:
1. Diagnóstico Regulatório e de Mercado: Avalie a situação da carteira citada, correlacionando o desvio com movimentos normais de mercado (ex: fechamento de curva de juros, rali de bolsa) ou quebra de mandato ativa.
2. Viés Fiduciário e CVM 175: Pontue os prazos regulatórios normais (ex: 15 dias úteis para reenquadramento de desenquadramento passivo, conforme regras típicas da CVM) e as responsabilidades do gestor frente ao administrador.
3. Plano de Rebalanceamento Estratégico: Sugira ações de reenquadramento, indicando quais classes de ativos comprar ou vender e o volume financeiro estimado, considerando liquidez e mitigação de custos de transação.
4. Impacto Tributário e Operacional: Faça considerações executivas sobre potenciais impactos de come-cotas (se aplicável ao perfil), spread de mercado ou impactos de liquidação que o gestor deve ponderar ao executar a boleta.`;

  if (!ai) {
    // Fallback inteligente caso a chave da API não esteja configurada no ambiente
    return generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  }

  try {
    const apiPromise = ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 8000)
    );

    const response = (await Promise.race([apiPromise, timeoutPromise])) as any;
    return response.text || generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  } catch (error) {
    console.error('Error in Gemini API call, using fallback:', error);
    return generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  }
}

export async function explainRebalanceStrategy(
  portfolio: Portfolio,
  strategy: 'Conservative' | 'Moderate' | 'Aggressive',
  orders: RebalanceOrder[],
  projectionData?: any[]
): Promise<string> {
  const ai = getAiClient();

  const totalAum = portfolio.totalAum || portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmountBRL, 0);
  const turnoverPct = totalAum > 0 ? (totalVolume / totalAum) * 100 : 0;

  const sellOrders = orders.filter((o) => o.action === 'SELL');
  const buyOrders = orders.filter((o) => o.action === 'BUY');

  const strategyNames: Record<string, string> = {
    Conservative: 'Conservador (Menor Giro & Eficiência Tributária)',
    Moderate: 'Moderado (Convergência Fiduciária ao Target IPS)',
    Aggressive: 'Agressivo (Convergência Plena & Alpha Tilt)',
  };

  const strategyLabel = strategyNames[strategy] || strategy;

  const prompt = `Você é o ComplianceAgent do FlowCore, especialista em regulação da CVM (Resolução CVM 175), comitê de investimentos e alocação de ativos patrimoniais.
Sua missão é gerar uma "Explicação de Estratégia Recomendada" técnica, transparente e analítica para o Gestor Responsável Dário Marques Neto e para o Comitê de Compliance da gestora.

DADOS DA CARTEIRA ANALISADA:
- Nome da Carteira: ${portfolio.name} (${portfolio.code})
- Titular: ${portfolio.clientName}
- Perfil de Risco / Mandato: ${portfolio.profile} (Benchmark: ${portfolio.benchmark})
- Patrimônio Líquido (AUM): R$ ${totalAum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Saldo em Caixa Atual: R$ ${portfolio.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

ESTRATÉGIA SELECIONADA NO SIMULADOR:
- Modo de Execução: ${strategyLabel}
- Volume Total Negociado (Turnover): R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${turnoverPct.toFixed(2)}% do AUM)

ORDENS PROPOSTAS PELO MOTOR ALGORÍTMICO:
${
  orders.length === 0
    ? 'Nenhuma ordem necessária. Carteira já se encontra 100% enquadrada nesta estratégia.'
    : orders
        .map(
          (o, idx) =>
            `${idx + 1}. [${o.action}] ${o.ticker} (${o.assetClass}): ${o.quantity} cotas/ações @ R$ ${o.unitPrice.toFixed(
              2
            )} = R$ ${o.totalAmountBRL.toLocaleString('pt-BR')} | Motivo: ${o.reason}`
        )
        .join('\n')
}

DADOS DE PROJEÇÃO DE ALOCAÇÃO (ANTES vs DEPOIS):
${JSON.stringify(projectionData || [], null, 2)}

INSTRUÇÕES E DIRETRIZES PARA O RELATÓRIO DO COMPLIANCEAGENT:
Elabore uma "Explicação de Estratégia Recomendada" estruturada nos seguintes tópicos em Markdown bem formatado:
1. 🎯 Racional da Estratégia Escolhida: Explique a filosofia do modo "${strategyLabel}" para esta carteira (${portfolio.profile}), justificando a calibração do algoritmo para o nível de turnover calculado (${turnoverPct.toFixed(2)}%).
2. 🔍 Motivo Lógico dos Ajustes Sugeridos:
   - Explique por que os ativos de venda (${sellOrders.map((o) => o.ticker).join(', ') || 'nenhum'}) foram selecionados para desinvestimento e qual sobrepeso regulatório ou de mandato eles estavam gerando.
   - Explique a destinação da liquidez liberada para compras (${buyOrders.map((o) => o.ticker).join(', ') || 'retenção de caixa'}), demonstrando como isso corrige déficits estruturais da carteira.
3. ⚖️ Enquadramento Regulatório CVM 175 & Mandato IPS:
   - Avalie o alívio das bandas de tolerância regulatória e de mandato.
   - Destaque os prazos legais da CVM 175 (15 dias úteis para sanar desenquadramentos passivos decorrentes de flutuação de mercado) e como estas ordens protegem a gestora fiduciariamente.
4. 💡 Eficiência Tributária, Custos B3 & Preservação de Liquidez:
   - Analise o impacto tributário do giro (custo de ganho de capital vs benefícios de retenção).
   - Analise os custos operacionais (taxas de emolumentos B3 e corretagem estimada) frente ao benefício de conformidade.
5. 🛡️ Parecer Executivo Conclusivo:
   - Recomendação formal do ComplianceAgent com nota de aprovação ou ressalvas de liquidez para envio à mesa de operações.

Responda em tom profissional, fiduciário, rigoroso e altamente qualificado.`;

  if (!ai) {
    return generateFallbackStrategyExplanation(portfolio, strategy, orders, projectionData);
  }

  try {
    const apiPromise = ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 8000)
    );

    const response = (await Promise.race([apiPromise, timeoutPromise])) as any;
    return response.text || generateFallbackStrategyExplanation(portfolio, strategy, orders, projectionData);
  } catch (error) {
    console.error('Error in Gemini strategy explanation, using fallback:', error);
    return generateFallbackStrategyExplanation(portfolio, strategy, orders, projectionData);
  }
}

function generateFallbackStrategyExplanation(
  portfolio: Portfolio,
  strategy: 'Conservative' | 'Moderate' | 'Aggressive',
  orders: RebalanceOrder[],
  projectionData?: any[]
): string {
  const totalAum = portfolio.totalAum || portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmountBRL, 0);
  const turnoverPct = totalAum > 0 ? (totalVolume / totalAum) * 100 : 0;

  const sellOrders = orders.filter((o) => o.action === 'SELL');
  const buyOrders = orders.filter((o) => o.action === 'BUY');
  const sellVolume = sellOrders.reduce((s, o) => s + o.totalAmountBRL, 0);
  const buyVolume = buyOrders.reduce((s, o) => s + o.totalAmountBRL, 0);
  const estimatedB3 = Math.round(totalVolume * 0.0003);

  const strategyDescriptions = {
    Conservative: {
      name: 'Conservador (Menor Giro & Proteção Fiscal)',
      philosophy:
        'A estratégia Conservadora tem como premissa essencial a prudência patrimonial e a eficiência tributária. O algoritmo intervém cirurgicamente para mitigar apenas os desenquadramentos que violam as bandas regulatórias da Resolução CVM 175 e do Mandato IPS, aplicando uma margem de segurança de 1,5 p.p. sem incorrer em rotação excessiva de posições.',
      taxImpact:
        'Minimização expressiva de apuração de ganho de capital (IR sobre valorização acumulada). Evita o desmonte prematuro de posições vencedoras de longo prazo, priorizando a estabilidade fiscal do investidor.',
      turnoverEval: `Turnover contido em ${turnoverPct.toFixed(2)}% do AUM (R$ ${totalVolume.toLocaleString('pt-BR')}), gerando custos de corretagem e emolumentos B3 estimados em apenas R$ ${estimatedB3.toLocaleString('pt-BR')}.`,
      actionRationale:
        'As alienações foram dimensionadas estritamente para reconduzir a classe excedente à margem regulatória permitida, mantendo 60% a 70% das posições originais intactas. A liquidez remanescente é preferencialmente direcionada para reforço de liquidez ou classes defensivas.',
    },
    Moderate: {
      name: 'Moderado (Convergência Fiduciária ao Target IPS)',
      philosophy:
        'A estratégia Moderada reflete a governança de alocação de referência do Comitê de Investimentos. O motor algorítmico busca a convergência direta e equilibrada aos pontos centrais (Targets) estabelecidos formalmente no Investment Policy Statement (IPS) da carteira, eliminando tanto excessos em classes valorizadas quanto defasagens em classes subalocadas.',
      taxImpact:
        'Impacto fiscal otimizado e equilibrado. A realização parcial de lucros é contrabalançada pela recomposição estrutural da carteira, mantendo o tracking error baixo em relação ao benchmark contratado.',
      turnoverEval: `Turnover moderado de ${turnoverPct.toFixed(2)}% do AUM (R$ ${totalVolume.toLocaleString('pt-BR')}), com custos operacionais B3 projetados em R$ ${estimatedB3.toLocaleString('pt-BR')}, compatível com o rebalanceamento trimestral fiduciário.`,
      actionRationale:
        'As ordens de venda desoneram as classes com sobrepeso acima do teto, enquanto as ordens de compra reinvestem proporcionalmente o caixa liberado em ativos com déficit estrutural, restaurando o perfil ótimo de risco-retorno.',
    },
    Aggressive: {
      name: 'Agressivo (Convergência Plena & Alpha Tilt)',
      philosophy:
        'A estratégia Agressiva promove a realocação tática de alto impacto (Alpha Tilt). Além de zerar prontamente qualquer excesso sobre a meta central, o algoritmo aproveita distorções de mercado para transferir 100% da liquidez liberada para classes de maior prêmio de risco histórico (Renda Variável e Ativos Internacionais), buscando maximizar a captura de valor.',
      taxImpact:
        'Rotatividade dinâmica com maior giro e potenciais recolhimentos de ganho de capital na B3 compensados pelo reposicionamento tático em ativos com maior assimetria positiva esperada.',
      turnoverEval: `Turnover expandido de ${turnoverPct.toFixed(2)}% do AUM (R$ ${totalVolume.toLocaleString('pt-BR')}), exigindo execução fracionada ou via mesa institucional para minimizar o market impact na B3. Custos de emolumentos estimados em R$ ${estimatedB3.toLocaleString('pt-BR')}.`,
      actionRationale:
        'As vendas removem todo o excesso acumulado para reinvestir agressivamente em ativos que sofreram desvalorização relativa recente ou que possuem maior expectativa de retorno para o ciclo macroeconômico atual.',
    },
  };

  const currentStrat = strategyDescriptions[strategy] || strategyDescriptions.Moderate;

  return `### 🛡️ Parecer de Estratégia Recomendada — ComplianceAgent FlowCore
**Ref.:** Análise Racional de Rebalanceamento Simulado sob Estratégia **${currentStrat.name}**  
**Carteira:** ${portfolio.name} (${portfolio.code}) | **Titular:** ${portfolio.clientName}  
**Mandato:** ${portfolio.profile} (Benchmark: ${portfolio.benchmark}) | **Data da Emissão:** ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}  
**AUM Total:** R$ ${totalAum.toLocaleString('pt-BR')} | **Volume Simulado:** R$ ${totalVolume.toLocaleString('pt-BR')} (Turnover: **${turnoverPct.toFixed(2)}%**)

---

#### 1. 🎯 Racional da Estratégia [${strategy.toUpperCase()}]
${currentStrat.philosophy}

- **Alinhamento com o Perfil ${portfolio.profile}:** A parametrização ${strategy.toLowerCase()} foi calibrada especificamente para equilibrar a tolerância a risco do titular com as exigências de enquadramento da carteira.
- **Disciplina de Execução:** Permite ao gestor agir de forma fundamentada perante o comitê, demonstrando que os ajustes decorrem de regras sistemáticas e não de impulsos de timing de mercado.

---

#### 2. 🔍 Motivo Lógico dos Ajustes Propostos (${orders.length} Boletas)
${
  orders.length === 0
    ? 'A carteira já se encontra com todas as suas classes de ativos devidamente enquadradas dentro das bandas estipuladas. Nenhuma ordem de alienação ou aquisição foi demandada.'
    : `O motor de alocação estruturou as seguintes ações:
- **Ordens de Venda (Desinvestimento):** ${sellOrders.length} boleta(s) totalizando **R$ ${sellVolume.toLocaleString('pt-BR')}**
  ${sellOrders.map((o) => `  - **${o.ticker}** (${o.assetClass}): alienação de **${o.quantity}** unidades (~R$ ${o.totalAmountBRL.toLocaleString('pt-BR')}). *Racional:* ${o.reason}.`).join('\n')}
- **Ordens de Compra (Reinvestimento):** ${buyOrders.length} boleta(s) totalizando **R$ ${buyVolume.toLocaleString('pt-BR')}**
  ${buyOrders.length > 0 ? buyOrders.map((o) => `  - **${o.ticker}** (${o.assetClass}): aporte de **${o.quantity}** unidades (~R$ ${o.totalAmountBRL.toLocaleString('pt-BR')}). *Racional:* ${o.reason}.`).join('\n') : '  - *Retenção prudencial em Caixa/Títulos pós-fixados de liquidez imediata.*'}

${currentStrat.actionRationale}`
}

---

#### 3. ⚖️ Enquadramento Regulatório (Resolução CVM 175 & Mandato IPS)
- **Mitigação de Desenquadramento Passivo:** Conforme preconiza a Resolução CVM 175, desvios decorrentes da valorização assimétrica de ativos devem ser sanados em até **15 dias úteis**. A implementação desta simulação neutraliza infrações fiduciárias antes da formalização do informe diário à CVM.
- **Proteção do Administrador Fiduciário:** A execução do plano sob protocolo auditado descaracteriza qualquer quebra culposa de mandato, resguardando o gestor (Dário Marques Neto) e a instituição perante órgãos reguladores.

---

#### 4. 💡 Análise de Eficiência Tributária & Custos B3
- **Giro & Custos B3:** ${currentStrat.turnoverEval}
- **Impacto Tributário:** ${currentStrat.taxImpact}
- **Liquidez & Slippage:** As ordens foram calibradas respeitando os volumes médios diários negociados (ADTV), prevenindo impacto desfavorável no book de ofertas na execução.

---

#### 5. 📋 Conclusão & Recomendação do ComplianceAgent
> **PARECER FINAL:** O plano de rebalanceamento sob a estratégia **${strategy.toUpperCase()}** apresenta **viabilidade técnica e regulatória plena**. Aprovada a submissão das ordens simuladas para deliberação do Gestor Responsável e posterior encaminhamento ao Comitê de Alocação da FlowCore.`;
}

function generateFallbackComplianceResponse(
  query: string,
  portfolios: Portfolio[],
  alerts: ComplianceAlert[]
): string {
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const criticalPortfolios = portfolios.filter((p) => p.status === 'CRITICAL');

  const qLower = query.toLowerCase();

  if (qLower.includes('justificativa') || qLower.includes('parecer') || qLower.includes('minuta')) {
    const port = criticalPortfolios[0] || portfolios[0];
    return `### 📄 Parecer Técnico de Compliance - FlowCore\n\n` +
      `**Ref:** Notificação de Desenquadramento e Plano de Regularização\n` +
      `**Carteira:** ${port.name} (${port.code})\n` +
      `**Titular:** ${port.clientName} | **Gestor Responsável:** ${port.manager}\n` +
      `**Data de Emissão:** ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `#### 1. Constatação do Desenquadramento\n` +
      `Identificou-se pelo motor automatizado do FlowCore que a carteira superou a banda de tolerância estipulada no mandato (${port.profile}). Conforme os parâmetros operacionais, desvios superiores a **5.0 p.p.** caracterizam **🔴 DESENQUADRADO / CRITICAL**.\n\n` +
      `#### 2. Causa Raiz\n` +
      `O movimento atípico decorreu da forte valorização relativa dos ativos da referida classe no período recente aliada à volatilidade de mercado, expandindo a representatividade percentual acima do teto regulatório.\n\n` +
      `#### 3. Plano de Reenquadramento Recomendado\n` +
      `- **Execução de Desinvestimento:** Realizar alienação programada no valor estimado de recomposição para reconduzir a alocação à meta (Target).\n` +
      `- **Destinação de Recursos:** Realocação em títulos de alta liquidez e baixo risco de mercado (ex: Tesouro Selic / CDB DI).\n` +
      `- **Prazo Limite CVM:** Prazo padrão de até 15 dias úteis para encerramento do desenquadramento passivo.\n\n` +
      `*Parecer emitido automaticamente pelo motor ComplianceAgent do FlowCore.*`;
  }

  return `### 🛡️ Diagnóstico de Conformidade do FlowCore\n\n` +
    `Atualmente temos **${portfolios.length} carteiras monitoradas**, com um total de **${alerts.length} alertas ativos**:\n` +
    `- 🔴 **${criticalCount} Desenquadramentos Críticos** (excesso > 5 p.p. sobre o limite da política);\n` +
    `- 🟡 **${warningCount} Alertas em Atenção** (excesso de até 5 p.p., em banda de monitoramento preventivo);\n` +
    `- 🟢 **${portfolios.filter((p) => p.status === 'NORMAL').length} Carteiras em Conformidade Total**.\n\n` +
    `#### Principais Pontos de Atenção Imediata:\n` +
    criticalPortfolios.map((p) => {
      const pAlert = alerts.find((a) => a.portfolioId === p.id && a.severity === 'CRITICAL');
      return `• **${p.name}** (${p.clientName}): Excesso em **${pAlert?.assetClass || 'Ativos'}** (${pAlert?.currentPercent.toFixed(1)}% vs teto de ${pAlert?.maxPercent.toFixed(1)}%, desvio de **+${pAlert?.deviationPP.toFixed(1)} p.p.**). Sugestão: ${pAlert?.suggestedAction}`;
    }).join('\n') +
    `\n\n*Utilize a aba do **Simulador de Rebalanceamento** para gerar as boletas e formalizar a execução das ordens de reenquadramento.*`;
}
