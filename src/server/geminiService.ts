import { GoogleGenAI } from '@google/genai';
import { Portfolio, ComplianceAlert } from '../types.ts';
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text || generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  } catch (error) {
    console.error('Error in Gemini API call, using fallback:', error);
    return generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  }
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
