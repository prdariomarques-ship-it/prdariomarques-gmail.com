import { AssetClass, AlertSeverity } from './types';

// ============================================================================
// POLICY ENGINE - TYPE DEFINITIONS
// ============================================================================

/**
 * Fonte normativa ou jurídica de onde a regra de investimento se origina.
 * - MANDATO_CLIENTE: Contrato bilateral de gestão e Investment Policy Statement (IPS).
 * - POLITICA_INTERNA: Diretriz prudencial interna configurável definida pelo Comitê de Risco da Gestora.
 * - REGRA_REGULATORIA: Norma legal externa imperativa (CVM 175, CMN 4.963, Anbima).
 * - SUITABILITY: Perfil de risco e suitability regulatório do investidor.
 */
export type RuleSource =
  | 'MANDATO_CLIENTE'
  | 'POLITICA_INTERNA'
  | 'REGRA_REGULATORIA'
  | 'SUITABILITY';

/**
 * Categoria funcional da política para segregação de governança na aplicação.
 */
export type PolicyCategory =
  | 'CLIENT_MANDATE'       // Mandato individual bilateral acordado com o cliente
  | 'INTERNAL_RISK_POLICY' // Política interna configurável da gestora / Comitê de Risco
  | 'REGULATORY_FRAMEWORK' // Marco regulatório externo (CVM / CMN / ANBIMA)
  | 'SUITABILITY_FRAMEWORK';

/**
 * Nível de severidade e rigidez no enforcement da regra.
 * - HARD_STOP: Impede a execução de boletas ou exige rebalanceamento imediato.
 * - WARNING_TOLERANCE: Permite margem de tolerância operacional antes de autuação.
 * - INFORMATIONAL: Alerta consultivo de monitoramento sem travas operacionais.
 */
export type StrictnessLevel = 'HARD_STOP' | 'WARNING_TOLERANCE' | 'INFORMATIONAL';

/**
 * Estado do ciclo de vida da política e da versão.
 */
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SUPERSEDED';

/**
 * Autoridade jurídica responsável pela aprovação ou alteração da política.
 */
export type GovernanceAuthority =
  | 'INVESTOR_AND_MANAGER' // Bilateral: Exige assinatura formal do cliente e do gestor
  | 'RISK_COMMITTEE'       // Comitê de Risco e Alocação Interno da Gestora
  | 'REGULATORY_BODY'      // CVM, CMN ou órgão regulador oficial
  | 'COMPLIANCE_OFFICER';  // Diretor de Compliance / Risco

/**
 * Tipos de métricas monitoradas pelas regras do Policy Engine.
 */
export type PolicyMetric =
  | 'ASSET_CLASS_ALLOCATION'    // Limite percentual por classe de ativo (ex: Renda Variável <= 35%)
  | 'SINGLE_ISSUER_EXPOSURE'   // Concentração máxima em um único emissor de crédito/banco (ex: <= 10%)
  | 'ILLIQUID_ASSET_CEILING'   // Teto de ativos ilíquidos ou carência longa > D+30 (ex: <= 20%)
  | 'FOREIGN_EXCHANGE_CEILING' // Exposição cambial / ativos no exterior (ex: <= 25%)
  | 'CREDIT_RATING_FLOOR'      // Rating mínimo de crédito privado (ex: >= AA-)
  | 'CASH_MINIMUM_RESERVE';    // Reserva de liquidez e caixa mínimo (ex: >= 5%)

/**
 * Operador de comparação da regra.
 */
export type RuleOperator = 'LTE' | 'GTE' | 'RANGE' | 'MAX_CONCENTRATION' | 'MIN_RESERVE';

// ----------------------------------------------------------------------------
// 1. POLICY RULE (Regra Atômica de Enquadramento)
// ----------------------------------------------------------------------------
export interface PolicyRule {
  /** Identificador único da regra */
  id: string;
  /** Identificador da política pai */
  policyId: string;
  /** Identificador da versão específica em que a regra foi promulgada */
  policyVersionId?: string;
  /** Código mnemônico da regra (ex: "RUL-RV-MAX-35", "RUL-EMISSOR-MAX-10") */
  code?: string;
  /** Nome descritivo da regra */
  name?: string;
  /** Classe de ativos alvo (quando aplicável) */
  assetClass: AssetClass;
  /** Perfil de investidor associado */
  profile: 'Conservador' | 'Moderado' | 'Arrojado' | 'Agressivo' | 'Institucional';
  /** Tipo de métrica avaliada */
  metric?: PolicyMetric;
  /** Operador relacional */
  operator?: RuleOperator;
  /** Percentual mínimo estipulado */
  minPercent: number;
  /** Percentual meta / target */
  targetPercent: number;
  /** Percentual máximo / limite normativo (teto) */
  maxPercent: number;
  /** Tolerância operacional em pontos percentuais antes de violação crítica (ex: 5.0 p.p.) */
  tolerancePP: number;
  /** Fonte jurídica da regra */
  ruleSource?: RuleSource;
  /** Alias de compatibilidade com versões legadas */
  source?: RuleSource;
  /** Rigor de execução fiduciária */
  strictness: StrictnessLevel;
  /** Prazo máximo (SLA) em dias corridos para reenquadramento após notificação */
  remediationDaysSLA?: number;
  /**
   * Explicação contextual e fiduciária da regra, diferenciando expressamente
   * as consequências entre mandato bilateral do cliente e política interna.
   */
  fiduciaryContextExplanation?: string;
  /** Data de início de vigência */
  effectiveDate: string;
  /** Indica se a regra está ativa e monitorada pelo ComplianceAgent */
  isActive?: boolean;
  /** Descrição técnica detalhada da regra */
  description?: string;
}

// ----------------------------------------------------------------------------
// 2. POLICY VERSION (Versionamento & Auditoria de Políticas)
// ----------------------------------------------------------------------------
export interface PolicyVersion {
  /** Identificador único da versão */
  id: string;
  /** Identificador da política associada */
  policyId: string;
  /** Identificador da versão semântica (ex: "v1.0", "v2.0", "v2.4") */
  versionNumber: string;
  /** Rótulo da versão (ex: "v2.4 - Revisão Semestral Alocação Offshore") */
  label: string;
  /** Status da versão */
  status: PolicyStatus;
  /** Data em que a versão entrou em vigor */
  effectiveFrom: string;
  /** Data em que a versão foi revogada ou substituída (se aplicável) */
  effectiveTo?: string;
  /** Registro formal das alterações introduzidas nesta versão */
  changelog: string;
  /** Autor ou gestor responsável pela minuta da versão */
  author: string;
  /** Autoridade ou comitê que homologou formalmente a versão */
  approvedBy: string;
  /** Timestamp da homologação formal */
  approvedAt: string;
  /**
   * Exige assinatura formal do cliente titular?
   * - TRUE para Mandatos de Cliente (IPS individual).
   * - FALSE para Políticas Internas Configuráveis da Gestora.
   */
  clientSignatureRequired: boolean;
  /** Data em que o cliente assinou digitalmente o termo do mandato (se aplicável) */
  clientSignedAt?: string;
  /** Hash criptográfico SHA-256 do documento normativo original para auditoria */
  auditDocumentHash: string;
  /** Coleção de regras ativas nesta versão */
  rules: PolicyRule[];
}

// ----------------------------------------------------------------------------
// 3. POLICY (Entidade Raiz da Política)
// ----------------------------------------------------------------------------
export interface Policy {
  /** Identificador único da política (ex: "IPS-AW-001", "POL-INT-EMISSOR-01") */
  id: string;
  /** Código formal de auditoria */
  code: string;
  /** Nome formal da política */
  name: string;
  /** Descrição executiva do propósito da política */
  description: string;
  /** Classificação da fonte jurídica */
  ruleSource?: RuleSource;
  /** Alias de compatibilidade com versões legadas */
  type?: RuleSource;
  /** Categoria estrutural */
  category?: PolicyCategory;
  /**
   * Flag discriminatória: Trata-se de um Mandato de Cliente bilateral?
   * Define que os limites são contratuais e individuais, exigindo anuência do cliente para alteração.
   */
  isClientMandate?: boolean;
  /**
   * Flag discriminatória: Trata-se de uma Política Interna configurável?
   * Define que os limites são estipulados pela governança da gestora e podem ser parametrizados pelo Comitê de Risco.
   */
  isInternalPolicy?: boolean;
  /**
   * Define se os parâmetros de limites e tolerâncias podem ser configurados
   * operacionalmente pelo gestor/comitê na interface sem necessidade de novo contrato bilateral.
   */
  isConfigurableByManager?: boolean;
  /** Nível de autoridade competente */
  governanceAuthority?: GovernanceAuthority;
  /** Rigor padrão de execução */
  defaultStrictness?: StrictnessLevel;
  /** Status atual da política */
  status: PolicyStatus | 'ACTIVE' | 'ARCHIVED';
  /** Identificador da versão em produção atual */
  activeVersionId?: string;
  /** Número da versão ativa (ex: "v2.4") */
  activeVersionNumber?: string;
  /** Alias legado para versão */
  version?: string;
  /** Data de vigência */
  effectiveDate?: string;
  /** Histórico completo de versões da política */
  versions?: PolicyVersion[];
  /** Regras vigentes da versão ativa */
  rules: PolicyRule[];
  /** Titular ou beneficiário principal (para mandatos individuais) */
  clientName?: string;
  /** Órgão ou gestor proprietário da política */
  ownerDepartment?: string;
  /** Periodicidade de revisão recomendada */
  reviewFrequency?: 'ANUAL' | 'SEMESTRAL' | 'TRIMESTRAL' | 'SOB_DEMANDA';
  /** Data da última revisão */
  lastReviewedAt?: string;
  /** Data da próxima revisão prevista */
  nextReviewDate?: string;
  /**
   * Texto oficial que sintetiza o impacto legal e operacional de um desenquadramento nesta política,
   * permitindo diferenciar claramente um mandato contratual de uma política de risco interno.
   */
  fiduciaryDistinctionSummary?: string;
}

// ----------------------------------------------------------------------------
// 4. POLICY ASSIGNMENT (Vínculo & Aplicação de Políticas a Carteiras)
// ----------------------------------------------------------------------------
export interface PolicyAssignment {
  /** Identificador único do vínculo */
  id: string;
  /** Identificador da política vinculada */
  policyId: string;
  /** Código formal da política */
  policyCode?: string;
  /** Nome formal da política */
  policyName?: string;
  /** Identificador da versão atribuída */
  policyVersionId?: string;
  /** Número da versão atribuída */
  policyVersionNumber?: string;
  /** Identificador da carteira de investimento vinculada */
  portfolioId: string;
  /** Nome da carteira vinculada */
  portfolioName?: string;
  /** Nome do cliente titular */
  clientName: string;
  /** Perfil da carteira */
  profile?: string;
  /** Fonte da política vinculada */
  ruleSource?: RuleSource;
  /**
   * É o mandato principal da carteira?
   * Toda carteira possui exatamente 1 mandato principal de cliente e pode ter N políticas internas aplicáveis.
   */
  isPrimaryMandate?: boolean;
  /** Status do vínculo */
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'EXPIRED' | 'SUSPENDED';
  /** Data em que a política foi vinculada à carteira */
  assignedAt?: string;
  /** Usuário ou gestor que realizou a atribuição */
  assignedBy?: string;
  /** Data de início dos efeitos */
  effectiveDate: string;
  /** Data de expiração ou revisão (opcional) */
  expiresAt?: string;
  /** Status da anuência formal do cliente (quando for Mandato do Cliente) */
  clientConsentStatus?: 'ASSINADO' | 'DISPENSADO' | 'PENDENTE';
  /** Parâmetros customizados ou exceções autorizadas pelo Comitê de Risco */
  customToleranceOverrides?: Partial<Record<AssetClass, number>>;
  /** Notas de conformidade da atribuição */
  complianceNotes?: string;
}

// ============================================================================
// POLICY ENGINE - HELPER UTILITIES
// ============================================================================

/**
 * Verifica se a política é um Mandato de Cliente bilateral.
 */
export function isClientMandate(policyOrSource: Policy | RuleSource | string): boolean {
  if (typeof policyOrSource === 'string') {
    return policyOrSource === 'MANDATO_CLIENTE';
  }
  return (
    policyOrSource.ruleSource === 'MANDATO_CLIENTE' ||
    policyOrSource.type === 'MANDATO_CLIENTE' ||
    policyOrSource.isClientMandate === true
  );
}

/**
 * Verifica se a política é uma Política Interna configurável da gestora.
 */
export function isInternalPolicy(policyOrSource: Policy | RuleSource | string): boolean {
  if (typeof policyOrSource === 'string') {
    return policyOrSource === 'POLITICA_INTERNA';
  }
  return (
    policyOrSource.ruleSource === 'POLITICA_INTERNA' ||
    policyOrSource.type === 'POLITICA_INTERNA' ||
    policyOrSource.isInternalPolicy === true
  );
}

/**
 * Retorna uma síntese estruturada e fiduciária sobre as diferenças fundamentais
 * entre limites de Mandato de Cliente e Políticas Internas configuráveis.
 */
export function getFiduciaryDistinctionDetails(ruleSource: RuleSource) {
  switch (ruleSource) {
    case 'MANDATO_CLIENTE':
      return {
        categoryLabel: 'Mandato do Cliente (IPS Contratual)',
        legalNature: 'Compromisso bilateral de alocação patrimonial individualizada firmado diretamente com o investidor.',
        fiduciaryRisk: 'Alto / Imediato: O desenquadramento gera responsabilidade civil e quebra de dever fiduciário perante o titular.',
        configurability: 'Não configurável unilateralmente: Qualquer alteração de piso/teto exige novo aditivo contratual ou IPS assinado pelo cliente.',
        enforcementAction: 'Rebalanceamento compulsório prioritário ou formalização de termo de anuência prévia com o cliente.',
        defaultSLA: '3 dias úteis para plano de reenquadramento.',
      };
    case 'POLITICA_INTERNA':
      return {
        categoryLabel: 'Política Interna Configurável (Governança da Gestora)',
        legalNature: 'Parâmetro prudencial normatizado pelo Comitê de Risco e Alocação da gestora para controle sistêmico da casa.',
        fiduciaryRisk: 'Médio / Governança: Não viola o contrato bilateral do cliente, mas constitui inconformidade corporativa interna.',
        configurability: 'Totalmente configurável: O Comitê de Risco pode ajustar bandas de tolerância e tetos dinamicamente conforme o cenário macroeconômico.',
        enforcementAction: 'Relatório imediato ao Comitê de Risco para análise de contingência, plano de enquadramento gradual ou aprovação de waiver.',
        defaultSLA: '15 dias úteis com reporte semanal ao comitê.',
      };
    case 'REGRA_REGULATORIA':
      return {
        categoryLabel: 'Regra Regulatória Externa (CVM 175 / CMN / ANBIMA)',
        legalNature: 'Norma legal cogente e imperativa de ordem pública, soberana sobre o mandato e a política interna.',
        fiduciaryRisk: 'Crítico: Infração regulatória perante a CVM/CMN passível de penalidade administrativa, multa ou termo de acusação.',
        configurability: 'Inalterável: Parâmetros fixados por regulamentação oficial.',
        enforcementAction: 'Notificação compulsória ao custodiante/administrador fiduciário e liquidação tempestiva de posições excedentes.',
        defaultSLA: 'Prazo estrito da Resolução CVM 175.',
      };
    default:
      return {
        categoryLabel: 'Diretriz de Suitability',
        legalNature: 'Adequação de produtos e ativos ao perfil de tolerância a risco cadastrado do cliente.',
        fiduciaryRisk: 'Elevado: Desvio de suitability perante Código ANBIMA e Resolução CVM 30.',
        configurability: 'Requer atualização cadastral do formulário de suitability.',
        enforcementAction: 'Assinatura de termo de ciência de risco ou desinvestimento de ativos incompatíveis.',
        defaultSLA: '5 dias úteis.',
      };
  }
}

// ============================================================================
// POLICY ENGINE - MOCK DATA
// ============================================================================

/**
 * 1. MOCK DE REGRAS (PolicyRule)
 * Demonstrando regras atômicas de Mandato de Cliente e Políticas Internas configuráveis.
 */
export const mockPolicyRules: PolicyRule[] = [
  // --------------------------------------------------------------------------
  // Regras de Mandato do Cliente (IPS-AW-001 - Roberto Silveira)
  // --------------------------------------------------------------------------
  {
    id: 'rul-aw-01',
    policyId: 'IPS-AW-001',
    policyVersionId: 'ver-ips-aw-001-v2.4',
    code: 'IPS-RS-RV-MAX',
    name: 'Teto Contratual de Renda Variável - Roberto Silveira',
    assetClass: 'Renda Variável',
    profile: 'Moderado',
    metric: 'ASSET_CLASS_ALLOCATION',
    operator: 'LTE',
    minPercent: 10.0,
    targetPercent: 25.0,
    maxPercent: 35.0,
    tolerancePP: 5.0,
    ruleSource: 'MANDATO_CLIENTE',
    strictness: 'HARD_STOP',
    remediationDaysSLA: 3,
    fiduciaryContextExplanation:
      'MANDATO_CLIENTE: Cláusula 4.1 do IPS pactuado com Roberto Silveira. Exceder 35.0% viola o contrato de gestão bilateral do cliente. Exige rebalanceamento compulsório ou aditivo formal.',
    effectiveDate: '01/01/2026',
    isActive: true,
    description: 'Limite máximo contratual de ações locais e BDRs para o mandato Moderado de Roberto Silveira.',
  },
  {
    id: 'rul-aw-02',
    policyId: 'IPS-AW-001',
    policyVersionId: 'ver-ips-aw-001-v2.4',
    code: 'IPS-RS-RF-MIN',
    name: 'Piso Contratual de Renda Fixa - Roberto Silveira',
    assetClass: 'Renda Fixa',
    profile: 'Moderado',
    metric: 'ASSET_CLASS_ALLOCATION',
    operator: 'GTE',
    minPercent: 40.0,
    targetPercent: 50.0,
    maxPercent: 65.0,
    tolerancePP: 5.0,
    ruleSource: 'MANDATO_CLIENTE',
    strictness: 'HARD_STOP',
    remediationDaysSLA: 5,
    fiduciaryContextExplanation:
      'MANDATO_CLIENTE: Cláusula 4.2 do IPS. Garante preservação de capital e alocação mínima de 40% em títulos soberanos ou crédito privado high grade.',
    effectiveDate: '01/01/2026',
    isActive: true,
    description: 'Piso e teto de renda fixa contratual para proteção de liquidez da carteira.',
  },
  {
    id: 'rul-aw-03',
    policyId: 'IPS-AW-001',
    policyVersionId: 'ver-ips-aw-001-v2.4',
    code: 'IPS-RS-CAIXA-BANDA',
    name: 'Banda Operacional de Caixa - Roberto Silveira',
    assetClass: 'Caixa',
    profile: 'Moderado',
    metric: 'CASH_MINIMUM_RESERVE',
    operator: 'RANGE',
    minPercent: 2.0,
    targetPercent: 5.0,
    maxPercent: 10.0,
    tolerancePP: 2.0,
    ruleSource: 'MANDATO_CLIENTE',
    strictness: 'WARNING_TOLERANCE',
    remediationDaysSLA: 5,
    fiduciaryContextExplanation:
      'MANDATO_CLIENTE: Cláusula 4.5 do IPS. Caixa destinado a honrar chamadas de capital e rebalanceamentos táticos.',
    effectiveDate: '01/01/2026',
    isActive: true,
    description: 'Banda estipulada para caixa imediato D+0.',
  },

  // --------------------------------------------------------------------------
  // Regras de Mandato do Cliente (IPS-BD-002 - Beatriz Drummond)
  // --------------------------------------------------------------------------
  {
    id: 'rul-bd-01',
    policyId: 'IPS-BD-002',
    policyVersionId: 'ver-ips-bd-002-v1.2',
    code: 'IPS-BD-RV-CEILING',
    name: 'Teto Restritivo de Renda Variável - Beatriz Drummond',
    assetClass: 'Renda Variável',
    profile: 'Conservador',
    metric: 'ASSET_CLASS_ALLOCATION',
    operator: 'LTE',
    minPercent: 0.0,
    targetPercent: 5.0,
    maxPercent: 10.0,
    tolerancePP: 2.5,
    ruleSource: 'MANDATO_CLIENTE',
    strictness: 'HARD_STOP',
    remediationDaysSLA: 2,
    fiduciaryContextExplanation:
      'MANDATO_CLIENTE: Cláusula 3.1 do IPS de Beatriz Drummond. Perfil estritamente conservador. Qualquer alocação acima de 10% constitui desenquadramento crítico de mandato.',
    effectiveDate: '15/01/2026',
    isActive: true,
    description: 'Teto estrito de ações e renda variável para cliente com perfil de baixa tolerância ao risco.',
  },

  // --------------------------------------------------------------------------
  // Regras de Política Interna Configurável (POL-INT-CONCENTRACAO - Gestora)
  // --------------------------------------------------------------------------
  {
    id: 'rul-int-conc-01',
    policyId: 'POL-INT-CONCENTRACAO',
    policyVersionId: 'ver-pol-int-conc-v3.0',
    code: 'POL-INT-EMISSOR-MAX-10',
    name: 'Limite Máximo Interno de Concentração por Emissor Privado',
    assetClass: 'Renda Fixa',
    profile: 'Moderado',
    metric: 'SINGLE_ISSUER_EXPOSURE',
    operator: 'MAX_CONCENTRATION',
    minPercent: 0.0,
    targetPercent: 5.0,
    maxPercent: 10.0,
    tolerancePP: 2.0,
    ruleSource: 'POLITICA_INTERNA',
    strictness: 'WARNING_TOLERANCE',
    remediationDaysSLA: 15,
    fiduciaryContextExplanation:
      'POLITICA_INTERNA: Diretriz prudencial do Comitê de Risco e Alocação da Gestora (Manual Interno de Risco Seção 8). Limita exposição agregada a um mesmo grupo econômico privado a 10% do AUM da carteira. Parâmetro configurável no comitê trimestral sem necessidade de alteração do IPS do cliente.',
    effectiveDate: '01/01/2026',
    isActive: true,
    description: 'Parâmetro interno configurável para controle de risco de crédito privado e solvência.',
  },
  {
    id: 'rul-int-liq-02',
    policyId: 'POL-INT-LIQUIDEZ',
    policyVersionId: 'ver-pol-int-liq-v2.1',
    code: 'POL-INT-LIQ-D15-MIN',
    name: 'Reserva Mínima Interna de Ativos Líquidos (<= D+15)',
    assetClass: 'Caixa',
    profile: 'Moderado',
    metric: 'ILLIQUID_ASSET_CEILING',
    operator: 'MIN_RESERVE',
    minPercent: 15.0,
    targetPercent: 25.0,
    maxPercent: 100.0,
    tolerancePP: 3.0,
    ruleSource: 'POLITICA_INTERNA',
    strictness: 'WARNING_TOLERANCE',
    remediationDaysSLA: 10,
    fiduciaryContextExplanation:
      'POLITICA_INTERNA: Política de Governança de Liquidez da Mesa de Operações. Garante colchão suficiente para resgates extraordinários sem necessidade de desinvestir ativos de baixa liquidez com deságio.',
    effectiveDate: '01/01/2026',
    isActive: true,
    description: 'Reserva de liquidez da casa configurável pelo gestor-chefe.',
  },

  // --------------------------------------------------------------------------
  // Regras Regulatórias Externas Cogentes (CVM-175 & CMN-4963)
  // --------------------------------------------------------------------------
  {
    id: 'rul-cvm-ext-01',
    policyId: 'CVM-175-ANEXO-I',
    policyVersionId: 'ver-cvm-175-v1.0',
    code: 'CVM-175-OFFSHORE-MAX-20',
    name: 'Teto Geral de Ativos no Exterior - CVM 175 Anexo I',
    assetClass: 'Internacional',
    profile: 'Moderado',
    metric: 'FOREIGN_EXCHANGE_CEILING',
    operator: 'LTE',
    minPercent: 0.0,
    targetPercent: 10.0,
    maxPercent: 20.0,
    tolerancePP: 3.0,
    ruleSource: 'REGRA_REGULATORIA',
    strictness: 'HARD_STOP',
    remediationDaysSLA: 5,
    fiduciaryContextExplanation:
      'REGRA_REGULATORIA: Art. 45 da Resolução CVM 175 Anexo Normativo I. Regra externa compulsória. Excesso acima do teto regulamentar impõe comunicação imediata ao custodiante e reenquadramento sob supervisão.',
    effectiveDate: '02/10/2023',
    isActive: true,
    description: 'Teto regulamentar da CVM para investimentos no exterior em carteiras administradas do público qualificado em geral.',
  },
  {
    id: 'rul-rpps-cmn-01',
    policyId: 'RES-CMN-4963-RPPS',
    policyVersionId: 'ver-cmn-4963-v1.0',
    code: 'CMN-4963-RV-RPPS-MAX-30',
    name: 'Teto de Renda Variável para Regimes Próprios (RPPS)',
    assetClass: 'Renda Variável',
    profile: 'Institucional',
    metric: 'ASSET_CLASS_ALLOCATION',
    operator: 'LTE',
    minPercent: 0.0,
    targetPercent: 20.0,
    maxPercent: 30.0,
    tolerancePP: 2.0,
    ruleSource: 'REGRA_REGULATORIA',
    strictness: 'HARD_STOP',
    remediationDaysSLA: 5,
    fiduciaryContextExplanation:
      'REGRA_REGULATORIA: Art. 20 da Resolução CMN 4.963/2021. Limite legal cogente para aplicação de recursos previdenciários de servidores públicos. Inobservância sujeita gestor a penalidades do Ministério da Previdência.',
    effectiveDate: '25/11/2021',
    isActive: true,
    description: 'Limite legal de ações e fundos de ações para mandatos de RPPS.',
  },
];

// ----------------------------------------------------------------------------
// 2. MOCK DE VERSÕES (PolicyVersion)
// ----------------------------------------------------------------------------
export const mockPolicyVersions: PolicyVersion[] = [
  {
    id: 'ver-ips-aw-001-v2.4',
    policyId: 'IPS-AW-001',
    versionNumber: '2.4',
    label: 'v2.4 - Ajuste de Banda Tática e Teto de Ações',
    status: 'ACTIVE',
    effectiveFrom: '01/01/2026',
    changelog:
      'Elevação da banda máxima de Renda Variável de 30% para 35% a pedido do cliente Roberto Silveira em reunião de alinhamento patrimonial semestral. Inclusão de BDRs no cômputo.',
    author: 'Carlos Eduardo Mendes (CFA)',
    approvedBy: 'Roberto Silveira (Cliente Titular) & Comitê Fiduciário',
    approvedAt: '28/12/2025 15:30:00',
    clientSignatureRequired: true,
    clientSignedAt: '28/12/2025 16:45:12',
    auditDocumentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    rules: mockPolicyRules.filter((r) => r.policyId === 'IPS-AW-001'),
  },
  {
    id: 'ver-ips-aw-001-v2.0',
    policyId: 'IPS-AW-001',
    versionNumber: '2.0',
    label: 'v2.0 - Revisão Anual de Mandato IPS 2025',
    status: 'SUPERSEDED',
    effectiveFrom: '01/01/2025',
    effectiveTo: '31/12/2025',
    changelog: 'Formalização de mandato moderado com 30% de teto de renda variável.',
    author: 'Carlos Eduardo Mendes (CFA)',
    approvedBy: 'Roberto Silveira (Cliente Titular)',
    approvedAt: '15/12/2024 10:00:00',
    clientSignatureRequired: true,
    clientSignedAt: '15/12/2024 11:20:00',
    auditDocumentHash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    rules: [],
  },
  {
    id: 'ver-ips-bd-002-v1.2',
    policyId: 'IPS-BD-002',
    versionNumber: '1.2',
    label: 'v1.2 - Mandato Inicial Conservador Beatriz Drummond',
    status: 'ACTIVE',
    effectiveFrom: '15/01/2026',
    changelog: 'Registro formal da política de investimento conservadora com ênfase em liquidez D+1 e Tesouro IPCA.',
    author: 'Marina Fagundes (CNPI)',
    approvedBy: 'Beatriz Drummond (Titular) & Marina Fagundes',
    approvedAt: '14/01/2026 14:00:00',
    clientSignatureRequired: true,
    clientSignedAt: '14/01/2026 15:10:00',
    auditDocumentHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    rules: mockPolicyRules.filter((r) => r.policyId === 'IPS-BD-002'),
  },
  {
    id: 'ver-pol-int-conc-v3.0',
    policyId: 'POL-INT-CONCENTRACAO',
    versionNumber: '3.0',
    label: 'v3.0 - Parâmetros Prudenciais de Crédito Privado 2026',
    status: 'ACTIVE',
    effectiveFrom: '01/01/2026',
    changelog:
      'Redução do teto de concentração por emissor de debêntures sem rating AAA de 12% para 10% do AUM da carteira para mitigar risco setorial de varejo.',
    author: 'Diretoria de Risco e Compliance FlowCore',
    approvedBy: 'Comitê de Risco & Alocação (Ata nº 42/2025)',
    approvedAt: '22/12/2025 17:00:00',
    clientSignatureRequired: false, // Política interna não requer assinatura de cliente
    auditDocumentHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    rules: mockPolicyRules.filter((r) => r.policyId === 'POL-INT-CONCENTRACAO'),
  },
  {
    id: 'ver-pol-int-liq-v2.1',
    policyId: 'POL-INT-LIQUIDEZ',
    versionNumber: '2.1',
    label: 'v2.1 - Diretriz de Liquidez e Stress Test de Caixa',
    status: 'ACTIVE',
    effectiveFrom: '01/01/2026',
    changelog: 'Fixação de piso de 15% em ativos de liquidez até D+15 para carteiras ativas.',
    author: 'Diretoria de Risco e Compliance FlowCore',
    approvedBy: 'Comitê de Risco & Alocação',
    approvedAt: '20/12/2025 11:00:00',
    clientSignatureRequired: false,
    auditDocumentHash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
    rules: mockPolicyRules.filter((r) => r.policyId === 'POL-INT-LIQUIDEZ'),
  },
  {
    id: 'ver-cvm-175-v1.0',
    policyId: 'CVM-175-ANEXO-I',
    versionNumber: '1.0',
    label: 'Resolução CVM 175 Anexo Normativo I',
    status: 'ACTIVE',
    effectiveFrom: '02/10/2023',
    changelog: 'Entrada em vigor do novo marco regulatório dos fundos de investimento e carteiras no Brasil.',
    author: 'Comissão de Valores Mobiliários (CVM)',
    approvedBy: 'Colegiado da CVM',
    approvedAt: '23/12/2022 00:00:00',
    clientSignatureRequired: false,
    auditDocumentHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    rules: mockPolicyRules.filter((r) => r.policyId === 'CVM-175-ANEXO-I'),
  },
  {
    id: 'ver-cmn-4963-v1.0',
    policyId: 'RES-CMN-4963-RPPS',
    versionNumber: '1.0',
    label: 'Resolução CMN nº 4.963/2021',
    status: 'ACTIVE',
    effectiveFrom: '25/11/2021',
    changelog: 'Limites de aplicação dos recursos dos Regimes Próprios de Previdência Social.',
    author: 'Conselho Monetário Nacional (CMN)',
    approvedBy: 'Ministério da Fazenda / Banco Central',
    approvedAt: '25/11/2021 00:00:00',
    clientSignatureRequired: false,
    auditDocumentHash: 'fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa',
    rules: mockPolicyRules.filter((r) => r.policyId === 'RES-CMN-4963-RPPS'),
  },
];

// ----------------------------------------------------------------------------
// 3. MOCK DE POLÍTICAS PRINCIPAIS (Policy)
// ----------------------------------------------------------------------------
export const mockPolicies: Policy[] = [
  // ==========================================================================
  // MANDATO DO CLIENTE 1 (IPS Individual Bilateral)
  // ==========================================================================
  {
    id: 'IPS-AW-001',
    code: 'IPS-AW-001',
    name: 'Mandato Bilateral Carteira Miguel',
    description:
      'Declaração formal de política de investimentos (IPS) acordada bilateralmente com o titular Roberto Silveira. Define regras e limites contratuais intransponíveis para a gestão discricionária de seu patrimônio.',
    ruleSource: 'MANDATO_CLIENTE',
    category: 'CLIENT_MANDATE',
    isClientMandate: true,
    isInternalPolicy: false,
    isConfigurableByManager: false, // Mandato do cliente não pode ser alterado unilateralmente pelo gestor
    governanceAuthority: 'INVESTOR_AND_MANAGER',
    defaultStrictness: 'HARD_STOP',
    status: 'ACTIVE',
    activeVersionId: 'ver-ips-aw-001-v2.4',
    activeVersionNumber: 'v2.4',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'IPS-AW-001'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'IPS-AW-001'),
    clientName: 'Roberto Silveira',
    ownerDepartment: 'Private Wealth Management',
    reviewFrequency: 'SEMESTRAL',
    lastReviewedAt: '28/12/2025',
    nextReviewDate: '30/06/2026',
    fiduciaryDistinctionSummary:
      'MANDATO DO CLIENTE (IPS CONTRATUAL): Compromisso bilateral direto com o investidor Roberto Silveira. O descumprimento dos limites de piso (40% RF) ou teto (35% RV) gera risco fiduciário contratual direto perante o titular. Exige rebalanceamento compulsório tempestivo ou assinatura de aditivo bilateral pelo cliente.',
  },

  // ==========================================================================
  // MANDATO DO CLIENTE 2 (IPS Individual Bilateral)
  // ==========================================================================
  {
    id: 'IPS-BD-002',
    code: 'IPS-BD-002',
    name: 'Mandato Bilateral Conservador - Beatriz Drummond',
    description:
      'Política de investimentos de perfil conservador, com forte restrição a risco de crédito de médio porte e teto máximo de 10% em renda variável para preservação de patrimônio familiar.',
    ruleSource: 'MANDATO_CLIENTE',
    category: 'CLIENT_MANDATE',
    isClientMandate: true,
    isInternalPolicy: false,
    isConfigurableByManager: false,
    governanceAuthority: 'INVESTOR_AND_MANAGER',
    defaultStrictness: 'HARD_STOP',
    status: 'ACTIVE',
    activeVersionId: 'ver-ips-bd-002-v1.2',
    activeVersionNumber: 'v1.2',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'IPS-BD-002'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'IPS-BD-002'),
    clientName: 'Beatriz Drummond',
    ownerDepartment: 'Wealth Planning',
    reviewFrequency: 'ANUAL',
    lastReviewedAt: '15/01/2026',
    nextReviewDate: '15/01/2027',
    fiduciaryDistinctionSummary:
      'MANDATO DO CLIENTE (IPS CONTRATUAL): Contrato bilateral com Beatriz Drummond. O desenquadramento compromete o dever fiduciário contratual individualizado, exigindo rebalanceamento para reenquadramento prioritário.',
  },

  // ==========================================================================
  // POLÍTICA INTERNA 1 (Configurável pela Gestora - Concentração de Emissor)
  // ==========================================================================
  {
    id: 'POL-INT-CONCENTRACAO',
    code: 'POL-INT-CONCENTRACAO',
    name: 'Diretriz Interna de Concentração de Risco de Crédito & Emissor',
    description:
      'Manual interno de risco aprovado pelo Comitê de Alocação da FlowCore. Estipula que nenhuma carteira gerida pela casa poderá deter mais de 10% do seu patrimônio exposto a um único grupo econômico privado, independente do mandato contratual.',
    ruleSource: 'POLITICA_INTERNA',
    category: 'INTERNAL_RISK_POLICY',
    isClientMandate: false,
    isInternalPolicy: true,
    isConfigurableByManager: true, // Configurável pelo Comitê de Risco interno da gestora
    governanceAuthority: 'RISK_COMMITTEE',
    defaultStrictness: 'WARNING_TOLERANCE',
    status: 'ACTIVE',
    activeVersionId: 'ver-pol-int-conc-v3.0',
    activeVersionNumber: 'v3.0',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'POL-INT-CONCENTRACAO'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'POL-INT-CONCENTRACAO'),
    ownerDepartment: 'Comitê de Risco & Alocação',
    reviewFrequency: 'TRIMESTRAL',
    lastReviewedAt: '22/12/2025',
    nextReviewDate: '31/03/2026',
    fiduciaryDistinctionSummary:
      'POLÍTICA INTERNA CONFIGURÁVEL (GOVERNANÇA DA GESTORA): Parâmetro prudencial estipulado pelo Comitê de Risco para salvaguardar a saúde da gestora e mitigar risco de cauda sistêmico. Não constitui quebra contratual bilateral com o cliente, mas sim uma inconformidade corporativa interna a ser tratada com planos de contingência ou concessão de waiver temporário pelo comitê.',
  },

  // ==========================================================================
  // POLÍTICA INTERNA 2 (Configurável pela Gestora - Gestão de Liquidez)
  // ==========================================================================
  {
    id: 'POL-INT-LIQUIDEZ',
    code: 'POL-INT-LIQUIDEZ',
    name: 'Política Interna de Gestão de Liquidez & Stress Test',
    description:
      'Diretrizes internas operacionais da mesa de gestão exigindo reserva mínima de 15% em ativos liquidáveis em até D+15 para manter flexibilidade operacional frente a volatilidades bruscas de mercado.',
    ruleSource: 'POLITICA_INTERNA',
    category: 'INTERNAL_RISK_POLICY',
    isClientMandate: false,
    isInternalPolicy: true,
    isConfigurableByManager: true,
    governanceAuthority: 'RISK_COMMITTEE',
    defaultStrictness: 'WARNING_TOLERANCE',
    status: 'ACTIVE',
    activeVersionId: 'ver-pol-int-liq-v2.1',
    activeVersionNumber: 'v2.1',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'POL-INT-LIQUIDEZ'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'POL-INT-LIQUIDEZ'),
    ownerDepartment: 'Mesa de Operações & Risco',
    reviewFrequency: 'TRIMESTRAL',
    lastReviewedAt: '20/12/2025',
    nextReviewDate: '31/03/2026',
    fiduciaryDistinctionSummary:
      'POLÍTICA INTERNA CONFIGURÁVEL (GOVERNANÇA DA GESTORA): Diretriz de controle de liquidez para gestão de caixa. Não fere o contrato com o cliente, sendo ajustada internamente pelo gestor de risco de liquidez.',
  },

  // ==========================================================================
  // REGRA REGULATÓRIA 1 (CVM 175)
  // ==========================================================================
  {
    id: 'CVM-175-ANEXO-I',
    code: 'CVM-175-ANEXO-I',
    name: 'Resolução CVM 175 - Limites de Ativos no Exterior & Governança',
    description:
      'Regulamento geral de fundos de investimento e carteiras administradas promulgado pela CVM. Estabelece limites máximos imperativos de concentração e investimentos offshore.',
    ruleSource: 'REGRA_REGULATORIA',
    category: 'REGULATORY_FRAMEWORK',
    isClientMandate: false,
    isInternalPolicy: false,
    isConfigurableByManager: false,
    governanceAuthority: 'REGULATORY_BODY',
    defaultStrictness: 'HARD_STOP',
    status: 'ACTIVE',
    activeVersionId: 'ver-cvm-175-v1.0',
    activeVersionNumber: 'v1.0',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'CVM-175-ANEXO-I'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'CVM-175-ANEXO-I'),
    ownerDepartment: 'Jurídico & Compliance Regulatório',
    reviewFrequency: 'ANUAL',
    lastReviewedAt: '02/10/2025',
    nextReviewDate: '02/10/2026',
    fiduciaryDistinctionSummary:
      'REGRA REGULATÓRIA (CVM 175): Norma legal imperativa de ordem pública. Prevalece sobre o mandato do cliente e a política interna. Qualquer violação exige notificação formal e desenquadramento tempestivo compulsório perante o regulador.',
  },

  // ==========================================================================
  // REGRA REGULATÓRIA 2 (CMN 4.963 RPPS)
  // ==========================================================================
  {
    id: 'RES-CMN-4963-RPPS',
    code: 'RES-CMN-4963-RPPS',
    name: 'Resolução CMN nº 4.963/2021 - Aplicações de RPPS',
    description:
      'Diretrizes do Conselho Monetário Nacional para limites de alocação de recursos previdenciários de regimes próprios de previdência de servidores públicos.',
    ruleSource: 'REGRA_REGULATORIA',
    category: 'REGULATORY_FRAMEWORK',
    isClientMandate: false,
    isInternalPolicy: false,
    isConfigurableByManager: false,
    governanceAuthority: 'REGULATORY_BODY',
    defaultStrictness: 'HARD_STOP',
    status: 'ACTIVE',
    activeVersionId: 'ver-cmn-4963-v1.0',
    activeVersionNumber: 'v1.0',
    versions: mockPolicyVersions.filter((v) => v.policyId === 'RES-CMN-4963-RPPS'),
    rules: mockPolicyRules.filter((r) => r.policyId === 'RES-CMN-4963-RPPS'),
    ownerDepartment: 'Gestão Institucional & RPPS',
    reviewFrequency: 'ANUAL',
    lastReviewedAt: '25/11/2025',
    nextReviewDate: '25/11/2026',
    fiduciaryDistinctionSummary:
      'REGRA REGULATÓRIA (CMN 4.963): Limite cogente aplicável a investidores institucionais do setor público previdenciário.',
  },
];

// ----------------------------------------------------------------------------
// 4. MOCK DE ATRIBUIÇÕES (PolicyAssignment)
// ----------------------------------------------------------------------------
export const mockPolicyAssignments: PolicyAssignment[] = [
  // Carteira port-001 (Roberto Silveira) vinculada ao seu Mandato IPS e às políticas internas
  {
    id: 'asg-001-ips-aw',
    policyId: 'IPS-AW-001',
    policyCode: 'IPS-AW-001',
    policyName: 'Mandato Bilateral Carteira Miguel',
    policyVersionId: 'ver-ips-aw-001-v2.4',
    policyVersionNumber: 'v2.4',
    portfolioId: 'port-001',
    portfolioName: 'Carteira Miguel',
    clientName: 'Roberto Silveira',
    ruleSource: 'MANDATO_CLIENTE',
    isPrimaryMandate: true,
    status: 'ACTIVE',
    assignedAt: '01/01/2026 09:00:00',
    assignedBy: 'Carlos Eduardo Mendes (CFA)',
    effectiveDate: '01/01/2026',
    clientConsentStatus: 'ASSINADO',
    complianceNotes: 'Mandato fiduciário principal assinado eletronicamente via Clicksign com certificado ICP-Brasil.',
  },
  {
    id: 'asg-001-pol-int-conc',
    policyId: 'POL-INT-CONCENTRACAO',
    policyCode: 'POL-INT-CONCENTRACAO',
    policyName: 'Diretriz Interna de Concentração de Risco de Crédito & Emissor',
    policyVersionId: 'ver-pol-int-conc-v3.0',
    policyVersionNumber: 'v3.0',
    portfolioId: 'port-001',
    portfolioName: 'Carteira Miguel',
    clientName: 'Roberto Silveira',
    ruleSource: 'POLITICA_INTERNA',
    isPrimaryMandate: false,
    status: 'ACTIVE',
    assignedAt: '01/01/2026 09:30:00',
    assignedBy: 'Comitê de Risco & Alocação',
    effectiveDate: '01/01/2026',
    clientConsentStatus: 'DISPENSADO',
    complianceNotes: 'Política interna corporativa de governança aplicada automaticamente a todas as carteiras administradas.',
  },
  {
    id: 'asg-001-pol-int-liq',
    policyId: 'POL-INT-LIQUIDEZ',
    policyCode: 'POL-INT-LIQUIDEZ',
    policyName: 'Política Interna de Gestão de Liquidez & Stress Test',
    policyVersionId: 'ver-pol-int-liq-v2.1',
    policyVersionNumber: 'v2.1',
    portfolioId: 'port-001',
    portfolioName: 'Carteira Miguel',
    clientName: 'Roberto Silveira',
    ruleSource: 'POLITICA_INTERNA',
    isPrimaryMandate: false,
    status: 'ACTIVE',
    assignedAt: '01/01/2026 09:30:00',
    assignedBy: 'Comitê de Risco & Alocação',
    effectiveDate: '01/01/2026',
    clientConsentStatus: 'DISPENSADO',
    complianceNotes: 'Monitoramento contínuo da liquidez para estresse de resgate em D+15.',
  },

  // Carteira port-002 (Beatriz Drummond)
  {
    id: 'asg-002-ips-bd',
    policyId: 'IPS-BD-002',
    policyCode: 'IPS-BD-002',
    policyName: 'Mandato Bilateral Conservador - Beatriz Drummond',
    policyVersionId: 'ver-ips-bd-002-v1.2',
    policyVersionNumber: 'v1.2',
    portfolioId: 'port-002',
    portfolioName: 'Carteira Miguel (Previdência)',
    clientName: 'Beatriz Drummond',
    ruleSource: 'MANDATO_CLIENTE',
    isPrimaryMandate: true,
    status: 'ACTIVE',
    assignedAt: '15/01/2026 10:00:00',
    assignedBy: 'Marina Fagundes (CNPI)',
    effectiveDate: '15/01/2026',
    clientConsentStatus: 'ASSINADO',
    complianceNotes: 'Mandato fiduciário assinado. Restrição estrita a crédito de bancos médios sem garantia.',
  },
  {
    id: 'asg-002-pol-int-conc',
    policyId: 'POL-INT-CONCENTRACAO',
    policyCode: 'POL-INT-CONCENTRACAO',
    policyName: 'Diretriz Interna de Concentração de Risco de Crédito & Emissor',
    policyVersionId: 'ver-pol-int-conc-v3.0',
    policyVersionNumber: 'v3.0',
    portfolioId: 'port-002',
    portfolioName: 'Carteira Miguel (Previdência)',
    clientName: 'Beatriz Drummond',
    ruleSource: 'POLITICA_INTERNA',
    isPrimaryMandate: false,
    status: 'ACTIVE',
    assignedAt: '15/01/2026 10:15:00',
    assignedBy: 'Comitê de Risco & Alocação',
    effectiveDate: '15/01/2026',
    clientConsentStatus: 'DISPENSADO',
    complianceNotes: 'Política interna de concentração com teto de 10% por emissor.',
  },

  // Carteira port-003 (Institucional RPPS Litoral)
  {
    id: 'asg-003-rpps',
    policyId: 'RES-CMN-4963-RPPS',
    policyCode: 'RES-CMN-4963-RPPS',
    policyName: 'Resolução CMN nº 4.963/2021 - Aplicações de RPPS',
    policyVersionId: 'ver-cmn-4963-v1.0',
    policyVersionNumber: 'v1.0',
    portfolioId: 'port-003',
    portfolioName: 'RPPS Fundo Previdenciário do Litoral',
    clientName: 'Instituto de Previdência do Litoral',
    ruleSource: 'REGRA_REGULATORIA',
    isPrimaryMandate: true,
    status: 'ACTIVE',
    assignedAt: '01/12/2025 08:30:00',
    assignedBy: 'Renata Vasconcellos (CFA)',
    effectiveDate: '01/12/2025',
    clientConsentStatus: 'ASSINADO',
    complianceNotes: 'Mandato regulatório compulsório com credenciamento formal na CVM e Previdência.',
  },
];
