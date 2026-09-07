export type AssetClass =
  | 'Renda Fixa'
  | 'Renda Variável'
  | 'Internacional'
  | 'Multimercado'
  | 'Caixa';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type DataMode = 'LIVE' | 'SIMULATION' | 'PROJECTION';

export type RuleSource =
  | 'MANDATO_CLIENTE'
  | 'POLITICA_INTERNA'
  | 'REGRA_REGULATORIA'
  | 'SUITABILITY';

export type StrictnessLevel = 'HARD_STOP' | 'WARNING_TOLERANCE' | 'INFORMATIONAL';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  allocationPercent: number;
}

export interface MandateLimit {
  assetClass: AssetClass;
  minPercent: number;
  targetPercent: number;
  maxPercent: number;
  policyId?: string;
  ruleSource?: RuleSource;
  tolerancePP?: number;
}

// ----------------------------------------------------
// POLICY ENGINE TYPES & MOCKS (Re-exported from ./types/policy & ./policyEngine)
// ----------------------------------------------------
export type {
  PolicyRule,
  PolicyVersion,
  Policy,
  PolicyAssignment,
  PolicyCategory,
  PolicyStatus,
  PolicyScope,
  GovernanceAuthority,
  PolicyMetric,
  RuleOperator,
} from './types/policy';

export {
  isClientSpecificMandate,
  isOfficeWideCompliance,
  getPolicyScopeDelineation,
} from './types/policy';

export {
  isClientMandate,
  isInternalPolicy,
  getFiduciaryDistinctionDetails,
  mockPolicies,
  mockPolicyVersions,
  mockPolicyRules,
  mockPolicyAssignments,
} from './policyEngine';

export interface Portfolio {
  id: string;
  name: string;
  clientName: string;
  code: string;
  manager: string;
  profile: 'Conservador' | 'Moderado' | 'Arrojado' | 'Agressivo' | 'Institucional';
  benchmark: string;
  totalAum: number;
  cashBalance: number;
  mandateLimits: MandateLimit[];
  assets: Asset[];
  status: AlertSeverity;
  lastRebalanced: string;
  notes?: string;
  assignedPolicyId?: string;
}

export interface AiExplanation {
  what: string;
  why: string;
  impact: string;
  action: string;
  confidence: number; // 0 a 100
  source: string; // e.g. "Policy IPS-AW-001 • Res. CVM 175 Anexo I"
}

export interface ComplianceAlert {
  id: string;
  portfolioId: string;
  portfolioName: string;
  clientName: string;
  assetClass: AssetClass;
  currentPercent: number;
  targetPercent: number;
  maxPercent: number;
  minPercent: number;
  deviationPP: number; // in percentage points, e.g. +7.5 p.p.
  severity: AlertSeverity;
  message: string;
  suggestedAction: string;
  excessValueBRL: number;
  recommendedTradeValue: number;
  timestamp: string;
  // Campos obrigatórios de auditoria e compliance
  ruleSource: RuleSource;
  policyId: string;
  limit: number;
  currentValue: number;
  difference: number;
  effectiveDate: string;
  tolerancePP: number;
  mandateVsInternalExplanation?: string;
  aiExplanation?: AiExplanation;
}

export interface RebalanceOrder {
  assetId: string;
  ticker: string;
  assetClass: AssetClass;
  action: 'BUY' | 'SELL';
  quantity: number;
  unitPrice: number;
  totalAmountBRL: number;
  reason: string;
}

export type RebalanceSafetyStage =
  | 'DETECT'
  | 'ANALYZE'
  | 'PROPOSE'
  | 'REVIEW'
  | 'APPROVE'
  | 'REVALIDATE'
  | 'EXECUTE'
  | 'AUDIT';

export interface RebalanceExecutionResult {
  success: boolean;
  portfolioId: string;
  timestamp: string;
  previousSeverity: AlertSeverity;
  newSeverity: AlertSeverity;
  executedOrders: RebalanceOrder[];
  auditLog: string;
  updatedPortfolio: Portfolio;
  isSimulationOnly: boolean; // Flag estrita: nunca fingir execução real na B3
  auditProtocolId: string;
  approvedBy: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  complianceContext?: {
    portfolioId?: string;
    suggestedOrders?: RebalanceOrder[];
  };
  aiExplanation?: AiExplanation;
}

export interface PipelineDeal {
  id: string;
  clientName: string;
  segment: 'Private Wealth' | 'Family Office' | 'Previdência' | 'Institucional';
  targetAum: number;
  stage: 'Due Diligence' | 'Proposta IPS' | 'Contrato em Assinatura' | 'Integralização';
  probability: number; // percent
  estimatedFeeAnnual: number;
  leadAdvisor: string;
  expectedClose: string;
}

export interface AdvisorPerformance {
  name: string;
  role: string;
  totalAum: number;
  monthlyRevenue: number;
  managedPortfoliosCount: number;
  criticalBreachesCount: number;
  warningBreachesCount: number;
  complianceScore: number;
}

// ----------------------------------------------------
// 8-FACTOR HEALTH SCORE BREAKDOWN
// ----------------------------------------------------
export interface HealthScoreFactors {
  relationship: number; // 0-100 (SLA de contato, satisfação)
  engagement: number; // 0-100 (Reuniões, leitura de relatórios)
  portfolio: number; // 0-100 (Aderência ao benchmark e retorno esperado)
  liquidity: number; // 0-100 (Reserva de caixa e prazos de resgate)
  concentration: number; // 0-100 (Diversificação por emissor e ativo)
  compliance: number; // 0-100 (Conformidade com mandatos, CVM e IPS)
  operations: number; // 0-100 (Pendências cadastrais e liquidação)
  opportunities: number; // 0-100 (Espaço para novos aportes e rebalanceamento)
}

export interface ClientRiskProfile {
  portfolioId: string;
  portfolioCode: string;
  portfolioName: string;
  clientName: string;
  profile: string;
  manager: string;
  totalAum: number;
  healthScore: number; // 0 to 100
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  primaryIssue: string;
  deviationPP: number;
  excessValueBRL: number;
  daysInBreach: number;
  ruleSource?: RuleSource;
  policyId?: string;
  factors?: HealthScoreFactors;
  healthFactors?: HealthScoreFactors;
  healthTrend?: 'UP' | 'STABLE' | 'DOWN';
  healthReasons?: string[];
  recommendedActions?: string[];
}

export interface FlowCoreAgentTelemetry {
  activeAgents: {
    name: string;
    role: string;
    status: 'ONLINE' | 'ANALYZING' | 'IDLE';
    version: string;
    lastPing: string;
  }[];
  eventsProcessed24h: number;
  actionsCompleted24h: number;
  approvalsPendingCount: number;
  issuesDetectedCount: number;
  lastAuditTimestamp: string;
}

