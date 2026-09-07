/**
 * @file src/types/policy.ts
 * Type definitions for the FlowCore Policy Engine.
 * 
 * Provides strong typing for:
 * - Policy: Root policy declaration differentiating Client Mandates vs. Office-wide Internal Policies
 * - PolicyRule: Atomic compliance rule with threshold bounds and fiduciary context
 * - PolicyVersion: Immutable audit and lifecycle versioning for regulatory compliance
 * - PolicyAssignment: Binding between a policy version and client portfolios
 */

// ============================================================================
// CORE ENUMS & BASE TYPES
// ============================================================================

export type AssetClass =
  | 'Renda Fixa'
  | 'Renda Variável'
  | 'Internacional'
  | 'Multimercado'
  | 'Caixa';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

/**
 * Legal or normative origin of the policy constraint.
 * - MANDATO_CLIENTE: Bilateral contract with the investor (Investment Policy Statement - IPS).
 * - POLITICA_INTERNA: Office-wide prudential guideline configured by the firm's Risk Committee.
 * - REGRA_REGULATORIA: Statutory regulatory mandate (e.g. CVM 175, CMN 4.963, Anbima).
 * - SUITABILITY: Investor risk profile suitability framework.
 */
export type RuleSource =
  | 'MANDATO_CLIENTE'
  | 'POLITICA_INTERNA'
  | 'REGRA_REGULATORIA'
  | 'SUITABILITY';

/**
 * Scope distinguishing client-specific agreements from office-wide policies.
 */
export type PolicyScope =
  | 'CLIENT_SPECIFIC' // Bound to a single client/portfolio via individual IPS
  | 'OFFICE_WIDE'     // Applies globally across all portfolios managed by the firm
  | 'DESK_SPECIFIC'   // Applies to a specific trading or asset management desk
  | 'REGULATORY';     // External legal framework enforced across all accounts

/**
 * Functional classification of the policy.
 */
export type PolicyCategory =
  | 'CLIENT_MANDATE'       // Individual investor contract (IPS)
  | 'INTERNAL_RISK_POLICY' // Internal office-wide risk and compliance policy
  | 'REGULATORY_FRAMEWORK' // External regulatory statutory body rules
  | 'SUITABILITY_FRAMEWORK'; // Investor suitability and profiling rules

/**
 * Level of enforcement strictness.
 * - HARD_STOP: Strictly forbids orders exceeding limits; immediate compulsory cure required.
 * - WARNING_TOLERANCE: Allows an operational buffer before triggering formal breach escalations.
 * - INFORMATIONAL: Advisory monitoring metric without order-entry blocks.
 */
export type StrictnessLevel = 'HARD_STOP' | 'WARNING_TOLERANCE' | 'INFORMATIONAL';

/**
 * Lifecycle status of policies and versions.
 */
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SUPERSEDED';

/**
 * Authority with jurisdiction to approve, amend, or grant exceptions to the policy.
 */
export type GovernanceAuthority =
  | 'INVESTOR_AND_MANAGER' // Bilateral: Requires both client counter-signature and manager sign-off
  | 'RISK_COMMITTEE'       // Office-wide Risk & Investment Committee
  | 'COMPLIANCE_OFFICER'   // Chief Compliance Officer (CCO)
  | 'REGULATORY_BODY';     // CVM, CMN, Anbima or statutory authority

/**
 * Target metric evaluated by the compliance engine.
 */
export type PolicyMetric =
  | 'ASSET_CLASS_ALLOCATION'    // E.g., Equities <= 35%
  | 'SINGLE_ISSUER_EXPOSURE'   // E.g., Concentration in private issuer <= 10%
  | 'ILLIQUID_ASSET_CEILING'   // E.g., Illiquid assets / redemption > D+30 <= 20%
  | 'FOREIGN_EXCHANGE_CEILING' // E.g., Offshore/FX assets <= 25%
  | 'CREDIT_RATING_FLOOR'      // E.g., Minimum credit rating >= AA-
  | 'CASH_MINIMUM_RESERVE';    // E.g., Liquidity reserve >= 5%

/**
 * Mathematical relational operator for evaluating compliance.
 */
export type RuleOperator = 'LTE' | 'GTE' | 'RANGE' | 'MAX_CONCENTRATION' | 'MIN_RESERVE';

// ============================================================================
// 1. POLICY RULE (Atomic Rule Specification)
// ============================================================================

/**
 * Represents an individual atomic compliance constraint.
 * Differentiates whether the constraint stems from an individual client mandate
 * or an office-wide compliance guideline.
 */
export interface PolicyRule {
  /** Unique rule identifier (e.g., 'rul-aw-01') */
  id: string;

  /** Reference to the parent Policy */
  policyId: string;

  /** Version of the policy under which this rule was issued */
  policyVersionId?: string;

  /** Mnemonic rule code (e.g., 'IPS-RS-RV-MAX', 'POL-INT-EMISSOR-MAX-10') */
  code?: string;

  /** Descriptive name of the rule */
  name?: string;

  /** Target asset class evaluated */
  assetClass: AssetClass;

  /** Target investor risk profile */
  profile: 'Conservador' | 'Moderado' | 'Arrojado' | 'Agressivo' | 'Institucional';

  /** Compliance metric evaluated */
  metric?: PolicyMetric;

  /** Comparison operator */
  operator?: RuleOperator;

  /** Minimum allocation percentage threshold (floor) */
  minPercent: number;

  /** Ideal target allocation percentage */
  targetPercent: number;

  /** Maximum allocation percentage threshold (ceiling) */
  maxPercent: number;

  /** Operational tolerance buffer in percentage points (p.p.) before critical breach */
  tolerancePP: number;

  /** Normative source of the rule */
  ruleSource?: RuleSource;

  /** Legacy alias for ruleSource */
  source?: RuleSource;

  /**
   * Scope discriminator:
   * - true: Rule is tailored specifically to a client's individual IPS.
   * - false: Rule applies across the office or to all accounts under the profile.
   */
  isClientSpecific?: boolean;

  /** Enforcement strictness */
  strictness: StrictnessLevel;

  /** Maximum remedy period (SLA) in business days upon breach */
  remediationDaysSLA?: number;

  /**
   * Explicit contextual explanation differentiating the fiduciary consequences
   * of violating this rule (Contractual client mandate breach vs. Internal policy alert).
   */
  fiduciaryContextExplanation?: string;

  /** Effective starting date */
  effectiveDate: string;

  /** Active monitoring status */
  isActive?: boolean;

  /** Technical description of the rule logic */
  description?: string;
}

// ============================================================================
// 2. POLICY VERSION (Audit Trail & Version Control)
// ============================================================================

/**
 * Immutable audit snapshot of a policy at a specific point in time.
 * Tracks amendments, formal approvals, client counter-signatures, and document hashes.
 */
export interface PolicyVersion {
  /** Unique version record ID */
  id: string;

  /** Parent policy identifier */
  policyId: string;

  /** Semantic version string (e.g., 'v1.0', 'v2.4') */
  versionNumber: string;

  /** Human-readable label for the release (e.g., 'v2.4 - Semiannual IPS Review') */
  label: string;

  /** Version lifecycle state */
  status: PolicyStatus;

  /** Date when this version took legal/operational effect */
  effectiveFrom: string;

  /** Date when this version was superseded or revoked */
  effectiveTo?: string;

  /** Comprehensive audit log of changes introduced in this version */
  changelog: string;

  /** Author or portfolio manager responsible for drafting the version */
  author: string;

  /** Approving authority (Client name or Risk Committee resolution ID) */
  approvedBy: string;

  /** Formal approval timestamp */
  approvedAt: string;

  /**
   * Mandate vs. Internal Policy distinction:
   * - true for Client Mandates: Requires explicit digital or physical client signature.
   * - false for Office-wide Internal Policies: Approved via internal Risk Committee quorum.
   */
  clientSignatureRequired: boolean;

  /** Timestamp of client signature (when required) */
  clientSignedAt?: string;

  /** Cryptographic SHA-256 hash of the formal legal instrument for audit verification */
  auditDocumentHash: string;

  /** Set of rules active under this specific version */
  rules: PolicyRule[];
}

// ============================================================================
// 3. POLICY (Root Governance Entity)
// ============================================================================

/**
 * Top-level policy entity.
 * Provides explicit flags and discriminators to cleanly differentiate between:
 * - Client-Specific Mandates (IPS)
 * - Office-Wide Internal Compliance Policies (Risk Committee parameters)
 * - Statutory Regulatory Frameworks (CVM / CMN / ANBIMA)
 */
export interface Policy {
  /** Unique policy identifier (e.g., 'IPS-AW-001', 'POL-INT-CONCENTRACAO') */
  id: string;

  /** Formal reference code */
  code: string;

  /** Official policy title */
  name: string;

  /** Executive summary of policy scope and purpose */
  description: string;

  /** Normative origin category */
  ruleSource?: RuleSource;

  /** Legacy alias for ruleSource */
  type?: RuleSource;

  /** Operational scope: CLIENT_SPECIFIC vs. OFFICE_WIDE */
  scope?: PolicyScope;

  /** Functional category */
  category?: PolicyCategory;

  /**
   * Discriminator Flag: Is this a Client-Specific Mandate?
   * - If true: Limiting bounds are contractually negotiated with an individual investor.
   * - Cannot be modified unilaterally by the asset manager.
   * - Violations constitute direct breach of fiduciary contract with the client.
   */
  isClientMandate?: boolean;

  /**
   * Discriminator Flag: Is this an Office-Wide Compliance Policy?
   * - If true: Internal prudential rule designed by the firm's Risk Committee.
   * - Applies firm-wide to protect against systemic and concentration risks.
   * - Violations are internal governance infractions, resolved by committee waiver or planned rebalancing.
   */
  isInternalPolicy?: boolean;

  /**
   * Indicates whether limits, weights, and tolerances can be dynamically
   * tuned in the application by the manager/Risk Committee without signing a new client contract.
   */
  isConfigurableByManager?: boolean;

  /**
   * Indicates whether this policy applies by default across all active client portfolios.
   */
  appliesOfficeWide?: boolean;

  /** Authority with competence to approve changes */
  governanceAuthority?: GovernanceAuthority;

  /** Default strictness enforcement level */
  defaultStrictness?: StrictnessLevel;

  /** Lifecycle status */
  status: PolicyStatus | 'ACTIVE' | 'ARCHIVED';

  /** Identifier of the currently active version */
  activeVersionId?: string;

  /** Active version number display string */
  activeVersionNumber?: string;

  /** Legacy version field */
  version?: string;

  /** Effective date of the current revision */
  effectiveDate?: string;

  /** Complete historical audit versions */
  versions?: PolicyVersion[];

  /** Active rules currently in effect */
  rules: PolicyRule[];

  /** Client ID (populated when isClientMandate is true) */
  clientId?: string;

  /** Client Name (populated when isClientMandate is true) */
  clientName?: string;

  /** Department or desk responsible for managing the policy */
  ownerDepartment?: string;

  /** Recommended formal review cycle */
  reviewFrequency?: 'ANUAL' | 'SEMESTRAL' | 'TRIMESTRAL' | 'SOB_DEMANDA';

  /** Timestamp of the last formal audit review */
  lastReviewedAt?: string;

  /** Scheduled next review date */
  nextReviewDate?: string;

  /**
   * Official fiduciary summary clearly spelling out the legal and contractual
   * distinction of breaches under this policy.
   */
  fiduciaryDistinctionSummary?: string;
}

// ============================================================================
// 4. POLICY ASSIGNMENT (Binding Between Portfolio & Policy)
// ============================================================================

/**
 * Represents the assignment of a policy to a client portfolio.
 * Portfolios typically have:
 * - Exactly ONE primary Client Mandate (the investor's contractual IPS)
 * - Multiple applicable Office-Wide compliance and regulatory policies.
 */
export interface PolicyAssignment {
  /** Unique assignment identifier */
  id: string;

  /** Linked policy identifier */
  policyId: string;

  /** Policy code */
  policyCode?: string;

  /** Policy name */
  policyName?: string;

  /** Version of the policy bound to the portfolio */
  policyVersionId?: string;

  /** Version number */
  policyVersionNumber?: string;

  /** Portfolio identifier */
  portfolioId: string;

  /** Portfolio name */
  portfolioName?: string;

  /** Investor client identifier */
  clientId?: string;

  /** Investor client name */
  clientName: string;

  /** Investor risk profile */
  profile?: string;

  /** Normative rule source */
  ruleSource?: RuleSource;

  /**
   * Assignment scope differentiation:
   * - 'CLIENT_MANDATE': Primary contractual IPS assigned to the portfolio.
   * - 'OFFICE_WIDE_DEFAULT': Global firm compliance policy automatically inherited.
   * - 'DESK_OVERRIDE': Customized desk parameter authorized by the Risk Committee.
   */
  assignmentType?: 'CLIENT_MANDATE' | 'OFFICE_WIDE_DEFAULT' | 'DESK_OVERRIDE';

  /**
   * Indicates whether this assignment constitutes the portfolio's primary client mandate.
   */
  isPrimaryMandate?: boolean;

  /** Binding status */
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'EXPIRED' | 'SUSPENDED';

  /** Timestamp when assignment was created */
  assignedAt?: string;

  /** User or compliance officer who performed the assignment */
  assignedBy?: string;

  /** Date when the policy took effect for this portfolio */
  effectiveDate: string;

  /** Optional expiration date */
  expiresAt?: string;

  /**
   * Consent status:
   * - 'ASSINADO': Client executed the formal IPS contract.
   * - 'DISPENSADO': Office-wide policy; client signature not required.
   * - 'PENDENTE': Client signature is awaiting execution.
   */
  clientConsentStatus?: 'ASSINADO' | 'DISPENSADO' | 'PENDENTE';

  /** Specific tolerance overrides authorized for this portfolio by the Risk Committee */
  customToleranceOverrides?: Partial<Record<AssetClass, number>>;

  /** Notes or audit remarks regarding this assignment */
  complianceNotes?: string;
}

// ============================================================================
// HELPER FUNCTIONS & TYPE GUARDS
// ============================================================================

/**
 * Type guard checking if a policy represents a client-specific mandate.
 */
export function isClientSpecificMandate(
  policy: Policy | PolicyRule | PolicyAssignment | RuleSource | string
): boolean {
  if (typeof policy === 'string') {
    return policy === 'MANDATO_CLIENTE' || policy === 'CLIENT_SPECIFIC' || policy === 'CLIENT_MANDATE';
  }
  if ('isClientMandate' in policy && policy.isClientMandate === true) return true;
  if ('isClientSpecific' in policy && policy.isClientSpecific === true) return true;
  if ('ruleSource' in policy && policy.ruleSource === 'MANDATO_CLIENTE') return true;
  if ('type' in policy && policy.type === 'MANDATO_CLIENTE') return true;
  if ('assignmentType' in policy && policy.assignmentType === 'CLIENT_MANDATE') return true;
  return false;
}

/**
 * Type guard checking if a policy represents an office-wide compliance policy.
 */
export function isOfficeWideCompliance(
  policy: Policy | PolicyRule | PolicyAssignment | RuleSource | string
): boolean {
  if (typeof policy === 'string') {
    return policy === 'POLITICA_INTERNA' || policy === 'OFFICE_WIDE' || policy === 'INTERNAL_RISK_POLICY';
  }
  if ('isInternalPolicy' in policy && policy.isInternalPolicy === true) return true;
  if ('appliesOfficeWide' in policy && policy.appliesOfficeWide === true) return true;
  if ('ruleSource' in policy && policy.ruleSource === 'POLITICA_INTERNA') return true;
  if ('type' in policy && policy.type === 'POLITICA_INTERNA') return true;
  if ('assignmentType' in policy && policy.assignmentType === 'OFFICE_WIDE_DEFAULT') return true;
  return false;
}

/**
 * Returns a detailed structural distinction between Client Mandates and Office-wide Policies.
 */
export function getPolicyScopeDelineation(policy: Policy | RuleSource) {
  const isClient = isClientSpecificMandate(policy);

  if (isClient) {
    return {
      scope: 'CLIENT_SPECIFIC' as const,
      label: 'Mandato Específico do Cliente (IPS Contratual)',
      legalNature: 'Compromisso bilateral de alocação individualizada assinado formalmente com o titular.',
      fiduciaryConsequences:
        'Alto Risco Fiduciário: Violações constituem quebra contratual direta perante o investidor, ensejando dever de indenização e reporte obrigatório.',
      configurability:
        'Não configurável unilateralmente: Qualquer ajuste exige termo aditivo formal ou nova versão do IPS assinada pelo cliente.',
      resolutionWorkflow:
        'Rebalanceamento compulsório prioritário com SLA curto (1-3 dias úteis) ou formalização de waiver assinado pelo cliente.',
    };
  }

  return {
    scope: 'OFFICE_WIDE' as const,
    label: 'Política Interna de Compliance (Governança da Casa)',
    legalNature: 'Parâmetro prudencial estipulado pelo Comitê de Risco e Alocação para mitigar riscos sistêmicos e de cauda.',
    fiduciaryConsequences:
      'Risco Corporativo / Governança: Violações constituem inconformidade operacional interna, sem quebra de contrato bilateral com o investidor.',
    configurability:
      'Totalmente configurável: Parâmetros, bandas de tolerância e prazos podem ser calibrados pelo Comitê de Risco na aplicação.',
    resolutionWorkflow:
      'Deliberação pelo Comitê de Risco para análise de contingência, plano gradual de desinvestimento ou concessão de waiver interno.',
  };
}
