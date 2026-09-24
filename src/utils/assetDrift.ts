import { Asset, Portfolio, AssetClass } from '../types';

export type DriftDirection = 'UP' | 'DOWN' | 'ON_TARGET';

export type DriftStatus =
  | 'CRITICAL_OVERWEIGHT' // Desvio acima do limite crítico (> 5.0 p.p.)
  | 'WARNING_OVERWEIGHT' // Alerta Preventivo de Drift para Cima (> +2.5 p.p.)
  | 'IN_TARGET' // Dentro da banda de tolerância tática (± 2.5 p.p.)
  | 'WARNING_UNDERWEIGHT' // Alerta Preventivo de Drift para Baixo (< -2.5 p.p.)
  | 'CRITICAL_UNDERWEIGHT'; // Desvio severo abaixo do limite crítico (< -5.0 p.p.)

export interface AssetDriftItem {
  assetId: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector?: string;
  portfolioId: string;
  portfolioName: string;
  clientName: string;
  currentValueBRL: number;
  currentAllocationPercent: number;
  targetPercent: number;
  driftPP: number; // atual - meta (p.p.)
  absDriftPP: number; // |atual - meta|
  tolerancePP: number; // padrão 2.5 p.p.
  criticalTolerancePP: number; // padrão 5.0 p.p.
  isDriftAlert: boolean; // absDriftPP > tolerancePP
  isCriticalAlert: boolean; // absDriftPP > criticalTolerancePP
  direction: DriftDirection;
  status: DriftStatus;
  statusLabel: string;
  rebalanceDeltaBRL: number; // R$ necessário para restaurar a meta
  suggestedAction: 'REDUZIR' | 'APORTAR' | 'MANTER';
  actionSummary: string;
  daysExceeded?: number;
}

export interface PortfolioDriftSummary {
  portfolioId: string;
  portfolioName: string;
  clientName: string;
  totalAum: number;
  totalAssetsCount: number;
  driftAlertsCount: number; // Ativos com |drift| > 2.5 p.p.
  criticalAlertsCount: number; // Ativos com |drift| > 5.0 p.p.
  overweightCount: number; // Ativos com drift > +2.5 p.p.
  underweightCount: number; // Ativos com drift < -2.5 p.p.
  inTargetCount: number; // Ativos dentro da banda ±2.5 p.p.
  totalRebalanceVolumeBRL: number;
  maxAssetDriftPP: number;
  items: AssetDriftItem[];
}

/**
 * Retorna a meta estratégica de alocação de um ativo.
 * Caso o ativo não tenha targetPercent explícito definido no banco/mock,
 * atribui uma meta prudencial baseada no peso inicial ou teto da classe.
 */
export function getAssetStrategicTarget(asset: Asset, portfolio?: Portfolio): number {
  if (asset.targetPercent !== undefined && asset.targetPercent > 0) {
    return asset.targetPercent;
  }

  // Targets padrão calibrados por ticker / perfil para os ativos da base
  const defaultTargetsByTicker: Record<string, number> = {
    // Miguel (Renda Fixa & Pós-fixado)
    'CDB-BBA-001': 2.5,
    '52678': 15.0, // Atual ~19.59% -> Drift +4.59% (Alerta ALTA)
    '56732': 12.0, // Atual ~14.72% -> Drift +2.72% (Alerta ALTA)
    '56855': 13.0, // Atual ~12.84% -> Drift -0.16% (Em linha)
    '59138': 15.0, // Atual ~12.10% -> Drift -2.90% (Alerta BAIXA)
    '58336': 8.0,  // Atual ~7.70% -> Drift -0.30% (Em linha)
    '57559': 6.5,  // Atual ~6.38% -> Drift -0.12% (Em linha)
    '58989': 3.5,  // Atual ~2.29% -> Drift -1.21% (Em linha)
    '54170': 1.0,  // Atual ~0.13% -> Drift -0.87% (Em linha)
    '56891': 0.0,
    'DEB-ITAU-AAA-01': 6.0,
    'DEB-VALE-IPCA-01': 4.0,
    'DEB-LOCALIZA-01': 1.5,
    'BOVA11': 4.0,
    'PETR4': 2.0, // Atual ~2.50% -> Em linha
    'VALE3': 1.5, // Atual ~0.13% -> Drift -1.37% (Em linha)
    'IVVB11': 3.0, // Atual ~3.29% -> Em linha
    'SPXI11': 3.0, // Atual ~2.98% -> Em linha

    // Wilson (Crédito & Energia & Internacional)
    'ITAU-DEB-INCENT-POSFIX': 6.0, // Atual ~8.96% -> Drift +2.96% (Alerta ALTA)
    'ITAU-INDEX-US-TECH-ACOES': 5.0, // Atual ~4.61% -> Drift -0.39% (Em linha)
    'ITAU-JANEIRO-MULTIMERCADO': 4.0, // Atual ~3.64% -> Drift -0.36% (Em linha)
    'ABSOLUTE-HIDRA-CDI-INFRA-RF-CP': 3.0, // Atual ~3.16% -> Em linha
    'ITAU-SINFONIA-MM-CREDITO-PRIVADO': 2.5, // Atual ~1.22% -> Em linha
    'DEB Origem Energia PRE 14,7% 15/12/2035': 5.0, // Atual ~7.92% -> Drift +2.92% (Alerta ALTA)
    'DEB Brava Energia IPCA 6,93% 15/10/2033': 4.5, // Atual ~3.74% -> Drift -0.76% (Em linha)
    'DEB Enauta Petróleo IPCA+ 7,2% 2031': 3.0, // Atual ~3.11% -> Em linha
    'DEB Petrobras 2030 DI+ 0,85%': 3.0, // Atual ~3.10% -> Em linha

    // Maria Eduarda (Arrojado / Internacional / Tech)
    'ast-maria-qqq': 10.0, // Atual ~13.50% -> Drift +3.50% (Alerta ALTA)
    'ast-maria-nvda': 4.0, // Atual ~7.20% -> Drift +3.20% (Alerta ALTA)
    'ast-maria-smal11': 6.0, // Atual ~3.10% -> Drift -2.90% (Alerta BAIXA)
  };

  if (defaultTargetsByTicker[asset.ticker]) {
    return defaultTargetsByTicker[asset.ticker];
  }
  if (defaultTargetsByTicker[asset.id]) {
    return defaultTargetsByTicker[asset.id];
  }
  if (defaultTargetsByTicker[asset.name]) {
    return defaultTargetsByTicker[asset.name];
  }

  // Fallback proporcional
  const fallback = Math.round(asset.allocationPercent * 10) / 10;
  return fallback > 0 ? fallback : 2.0;
}

/**
 * Calcula o desvio (drift) de um ativo individual vs sua meta estratégica
 */
export function calculateAssetDrift(
  asset: Asset,
  portfolio: Portfolio,
  customTolerancePP: number = 2.5,
  criticalTolerancePP: number = 5.0
): AssetDriftItem {
  const currentAllocation = Number(asset.allocationPercent) || 0;
  const targetPercent = getAssetStrategicTarget(asset, portfolio);
  const driftPP = Number((currentAllocation - targetPercent).toFixed(2));
  const absDriftPP = Math.abs(driftPP);

  const isDriftAlert = absDriftPP > customTolerancePP;
  const isCriticalAlert = absDriftPP > criticalTolerancePP;

  let direction: DriftDirection = 'ON_TARGET';
  if (driftPP > 0.05) direction = 'UP';
  else if (driftPP < -0.05) direction = 'DOWN';

  let status: DriftStatus = 'IN_TARGET';
  let statusLabel = 'Em Meta Estratégica';

  if (driftPP > criticalTolerancePP) {
    status = 'CRITICAL_OVERWEIGHT';
    statusLabel = 'Sobre-alocação Crítica (> 5.0 p.p.)';
  } else if (driftPP > customTolerancePP) {
    status = 'WARNING_OVERWEIGHT';
    statusLabel = 'Alerta de Drift Positivo (> 2.5 p.p.)';
  } else if (driftPP < -criticalTolerancePP) {
    status = 'CRITICAL_UNDERWEIGHT';
    statusLabel = 'Sub-alocação Crítica (< -5.0 p.p.)';
  } else if (driftPP < -customTolerancePP) {
    status = 'WARNING_UNDERWEIGHT';
    statusLabel = 'Alerta de Drift Negativo (< -2.5 p.p.)';
  }

  // Volume financeiro necessário para retornar à meta exata
  const totalAum = portfolio.totalAum || 1;
  const targetValueBRL = (targetPercent / 100) * totalAum;
  const rebalanceDeltaBRL = Number((targetValueBRL - asset.totalValue).toFixed(2));

  let suggestedAction: 'REDUZIR' | 'APORTAR' | 'MANTER' = 'MANTER';
  let actionSummary = 'Alocação equilibrada com o mandato.';

  if (isDriftAlert) {
    if (direction === 'UP') {
      suggestedAction = 'REDUZIR';
      actionSummary = `Venda tática de R$ ${Math.abs(rebalanceDeltaBRL).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} para retornar à meta (${targetPercent}%).`;
    } else {
      suggestedAction = 'APORTAR';
      actionSummary = `Aporte tático de R$ ${Math.abs(rebalanceDeltaBRL).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} para recompor a meta (${targetPercent}%).`;
    }
  }

  return {
    assetId: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    assetClass: asset.assetClass,
    sector: asset.sector,
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
    clientName: portfolio.clientName,
    currentValueBRL: asset.totalValue,
    currentAllocationPercent: currentAllocation,
    targetPercent,
    driftPP,
    absDriftPP,
    tolerancePP: customTolerancePP,
    criticalTolerancePP,
    isDriftAlert,
    isCriticalAlert,
    direction,
    status,
    statusLabel,
    rebalanceDeltaBRL,
    suggestedAction,
    actionSummary,
  };
}

/**
 * Analisa o drift de todos os ativos de uma carteira
 */
export function analyzePortfolioDrift(
  portfolio: Portfolio,
  customTolerancePP: number = 2.5
): PortfolioDriftSummary {
  const items = portfolio.assets.map((asset) =>
    calculateAssetDrift(asset, portfolio, customTolerancePP)
  );

  const driftAlerts = items.filter((item) => item.isDriftAlert);
  const criticalAlerts = items.filter((item) => item.isCriticalAlert);
  const overweight = items.filter((item) => item.driftPP > customTolerancePP);
  const underweight = items.filter((item) => item.driftPP < -customTolerancePP);
  const inTarget = items.filter((item) => !item.isDriftAlert);

  const totalRebalanceVolumeBRL = driftAlerts.reduce(
    (sum, item) => sum + Math.abs(item.rebalanceDeltaBRL),
    0
  );

  const maxAssetDriftPP = items.length > 0
    ? Math.max(...items.map((i) => i.absDriftPP))
    : 0;

  return {
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
    clientName: portfolio.clientName,
    totalAum: portfolio.totalAum,
    totalAssetsCount: items.length,
    driftAlertsCount: driftAlerts.length,
    criticalAlertsCount: criticalAlerts.length,
    overweightCount: overweight.length,
    underweightCount: underweight.length,
    inTargetCount: inTarget.length,
    totalRebalanceVolumeBRL,
    maxAssetDriftPP,
    items,
  };
}

/**
 * Analisa o drift de todos os ativos consolidados de todas as carteiras
 */
export function analyzeAllPortfoliosDrift(
  portfolios: Portfolio[],
  customTolerancePP: number = 2.5
): {
  summaries: PortfolioDriftSummary[];
  totalAssetsCount: number;
  totalDriftAlertsCount: number;
  totalCriticalAlertsCount: number;
  totalOverweightCount: number;
  totalUnderweightCount: number;
  totalRebalanceVolumeBRL: number;
  allDriftItems: AssetDriftItem[];
} {
  const summaries = portfolios.map((p) => analyzePortfolioDrift(p, customTolerancePP));
  const allDriftItems = summaries.flatMap((s) => s.items);

  const totalAssetsCount = allDriftItems.length;
  const totalDriftAlertsCount = allDriftItems.filter((i) => i.isDriftAlert).length;
  const totalCriticalAlertsCount = allDriftItems.filter((i) => i.isCriticalAlert).length;
  const totalOverweightCount = allDriftItems.filter((i) => i.driftPP > customTolerancePP).length;
  const totalUnderweightCount = allDriftItems.filter((i) => i.driftPP < -customTolerancePP).length;
  const totalRebalanceVolumeBRL = allDriftItems
    .filter((i) => i.isDriftAlert)
    .reduce((sum, item) => sum + Math.abs(item.rebalanceDeltaBRL), 0);

  return {
    summaries,
    totalAssetsCount,
    totalDriftAlertsCount,
    totalCriticalAlertsCount,
    totalOverweightCount,
    totalUnderweightCount,
    totalRebalanceVolumeBRL,
    allDriftItems,
  };
}
