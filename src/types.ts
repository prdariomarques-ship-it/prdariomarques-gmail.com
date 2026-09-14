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
  averagePrice?: number;
  unrealizedGainBRL?: number;
  unrealizedGainPercent?: number;
  holdingPeriodDays?: number;
  taxRatePercent?: number;
  isTaxExempt?: boolean;
  taxExemptionReason?: string;
  sector?: string;
  regulatoryLimitPercent?: number;
}

export type TaxStrategy =
  | 'TAX_LOSS_HARVESTING' // Priorizar venda de ativos em prejuízo para gerar crédito tributário
  | 'MINIMUM_CAPITAL_GAIN' // Priorizar menor ganho / ativos isentos para minimizar IR a pagar
  | 'B3_20K_EXEMPTION' // Calibrar vendas mensais de ações respeitando a isenção de R$ 20.000 da RFB
  | 'PRO_RATA_BALANCED'; // Venda proporcional ingênua (benchmark de mercado)

export interface AssetTaxDetail {
  assetId: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  quantityHeld: number;
  currentPrice: number;
  averagePrice: number;
  totalCurrentValueBRL: number;
  unrealizedGainLossBRL: number;
  unrealizedGainLossPercent: number;
  suggestedSellQty: number;
  suggestedSellAmountBRL: number;
  realizedGainLossBRL: number;
  estimatedTaxBRL: number;
  taxRatePercent: number;
  isTaxExempt: boolean;
  taxClassification: 'PREJUIZO_COMPENSAVEL' | 'LUCRO_TRIBUTAVEL' | 'ISENTO_LEGAL' | 'ISENTO_20K';
}

export interface TaxEfficiencyAnalysis {
  strategy: TaxStrategy;
  strategyLabel: string;
  strategyDescription: string;
  totalSellAmountBRL: number;
  totalCapitalGainBRL: number;
  totalEstimatedTaxBRL: number;
  totalHarvestedLossBRL: number;
  effectiveTaxRatePercent: number;
  taxSavingsVsNaiveBRL: number;
  proposedOrders: RebalanceOrder[];
  assetTaxBreakdown: AssetTaxDetail[];
}

export interface MandateLimit {
  assetClass: AssetClass;
  minPercent: number;
  targetPercent: number;
  maxPercent: number;
  policyId?: string;
  ruleSource?: RuleSource;
  tolerancePP?: number;
  warningTolerancePP?: number;
  criticalTolerancePP?: number;
  warningTriggerPercent?: number;
  criticalTriggerPercent?: number;
}

export interface AssetClassThresholdConfig {
  assetClass: AssetClass;
  minPercent: number;
  targetPercent: number;
  maxPercent: number;
  warningTolerancePP: number; // Margem ou desvio (p.p.) que dispara o alerta WARNING
  criticalTolerancePP: number; // Margem ou desvio (p.p.) que dispara o alerta CRITICAL
  warningTriggerPercent?: number; // Percentual absoluto de alocação que aciona o aviso
  criticalTriggerPercent?: number; // Percentual absoluto de alocação que aciona o crítico
  sourceDescription?: string;
  notes?: string;
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
  isProjected?: boolean;
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
  rule_source?: RuleSource;
  policy_id?: string;
  current_value?: number;
  difference: number;
  effectiveDate: string;
  tolerancePP: number;
  mandateVsInternalExplanation?: string;
  aiExplanation?: AiExplanation;
}

export interface ComplianceNotification {
  id: string;
  alertId: string;
  portfolioId: string;
  portfolioName: string;
  portfolioCode?: string;
  clientName: string;
  assetClass: AssetClass;
  severity: AlertSeverity;
  currentPercent: number;
  maxPercent: number;
  minPercent: number;
  deviationPP: number;
  excessValueBRL: number;
  ruleSource: RuleSource;
  policyId: string;
  limit?: number;
  currentValue?: number;
  difference?: number;
  rule_source?: RuleSource;
  policy_id?: string;
  current_value?: number;
  mandateVsInternalExplanation?: string;
  message: string;
  suggestedAction: string;
  timestamp: string;
  createdAt: number;
  read: boolean;
  secondaryChannelsNotified?: ('EMAIL' | 'SMS')[];
}

export interface EmailChannelConfig {
  enabled: boolean;
  recipient: string;
  sendOnCriticalOnly: boolean;
  includeReportAttachment: boolean;
  scheduledReportEnabled?: boolean;
  scheduledReportTime?: string;
  scheduledReportDayOfWeek?: string;
  scheduledReportCron?: string;
  severitiesFilter?: AlertSeverity[];
  assetClassesFilter?: AssetClass[];
  assetTolerances?: Partial<Record<AssetClass, number>>;
  customSubjectTemplate?: string;
  customBodyTemplate?: string;
}

export interface SmsChannelConfig {
  enabled: boolean;
  phoneNumber: string;
  sendOnCriticalOnly: boolean;
}

export interface NotificationChannelSettings {
  officeId?: string;
  email: EmailChannelConfig;
  sms: SmsChannelConfig;
  inAppAudio: boolean;
  logRetentionDays?: number;
  updatedAt?: string;
}

export interface SecondaryDispatchLog {
  id: string;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  status: 'SENT' | 'SIMULATED_DELIVERY' | 'FAILED';
  subjectOrTitle: string;
  bodyPreview: string;
  sentAt: string;
  alertId?: string;
  portfolioName?: string;
  severity?: AlertSeverity;
  reportType?: 'CRITICAL_ALERT' | 'SCHEDULED_SUMMARY' | 'TEST';
}

export interface AlertComplianceSnapshot {
  date: string; // e.g. '07/09'
  fullDate: string; // e.g. '07/09/2026'
  dayLabel: string; // e.g. 'Seg 07' or 'D-6'
  timestamp: number;
  totalPortfolios: number;
  compliantPortfolios: number;
  criticalAlerts: number;
  warningAlerts: number;
  complianceRate: number; // e.g. 83.3 (%)
  totalExcessBRL: number;
  marketContext?: string;
}

export interface ComplianceBreachHistoryPoint {
  date: string; // e.g. '07/Fev'
  fullDate: string; // e.g. '07/02/2026'
  dayIndex: number;
  totalBreaches: number;
  criticalBreaches: number;
  warningBreaches: number;
  totalExcessBRL: number;
  // Max deviation in p.p. recorded across portfolios
  maxDeviationPP: number;
  // Per-portfolio deviation in p.p. above limit
  portfolioDeviations: Record<string, number>;
  // Optional market event on that day
  eventTag?: string;
  marketNote?: string;
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
  // Campos de Otimização Fiscal
  averagePrice?: number;
  realizedGainLossBRL?: number;
  estimatedTaxBRL?: number;
  taxStrategyApplied?: TaxStrategy;
  taxClassification?: 'PREJUIZO_COMPENSAVEL' | 'LUCRO_TRIBUTAVEL' | 'ISENTO_LEGAL' | 'ISENTO_20K';
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

export interface PmxWealthAgentTelemetry {
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

