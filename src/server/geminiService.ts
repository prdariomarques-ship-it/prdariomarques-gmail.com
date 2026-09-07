import { GoogleGenAI } from '@google/genai';
import { Portfolio, ComplianceAlert } from '../types';
import { ComplianceAgent } from './complianceAgent';

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

  const prompt = `Você é o ComplianceAgent do FlowCore, um sistema avançado de conformidade regulatória de investimentos, governança de portfólios e rebalanceamento (aderente às regras da CVM 175, Anbima e melhores práticas de Family Offices e Asset Management).

Contexto atual das carteiras monitoradas:
${JSON.stringify(portfolioSummary, null, 2)}

Regras de Classificação do FlowCore:
- 🟢 NORMAL: Dentro do limite estipulado na política/mandato.
- 🟡 ATENÇÃO / WARNING: Acima do limite estipulado em até 5 p.p. (faixa de tolerância/alerta preventivo).
- 🔴 DESENQUADRADO / CRITICAL: Excesso superior a 5 p.p. acima do limite (desenquadramento formal que exige rebalanceamento imediato e comunicação ao comitê de compliance).

Pergunta do Usuário (Gestor / Assessor / Compliance Officer):
"${userQuery}"

Por favor, responda de forma técnica, executiva e altamente estruturada em português do Brasil:
1. Diagnóstico preciso da situação ou carteira citada.
2. Identificação das classes com violação e desvios em pontos percentuais (p.p.).
3. Ações sugeridas de rebalanceamento (quais ativos comprar ou vender e volume financeiro estimado).
4. Considerações regulatórias (CVM/Anbima, mitigação de custos de transação e impacto fiscal).`;

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
