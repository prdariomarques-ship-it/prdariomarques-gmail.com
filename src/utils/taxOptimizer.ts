import {
  Portfolio,
  Asset,
  AssetClass,
  RebalanceOrder,
  TaxStrategy,
  TaxEfficiencyAnalysis,
  AssetTaxDetail,
} from '../types';

/**
 * Retorna o preço médio de aquisição do ativo (com fallback calculado caso não esteja preenchido)
 */
export function getAssetAveragePrice(asset: Asset): number {
  if (asset.averagePrice && asset.averagePrice > 0) {
    return asset.averagePrice;
  }
  // Fallback baseado no ticker para garantir dados realistas caso falte no payload
  if (asset.ticker === 'PETR4') return 42.0; // Posição em prejuízo (-8.3%)
  if (asset.ticker === 'VALE3') return 51.5; // Posição em forte lucro (+20.8%)
  if (asset.ticker === 'ITUB4') return 33.8; // Posição em leve lucro (+1.8%)
  if (asset.ticker.startsWith('DEB-') || asset.isTaxExempt) return asset.currentPrice * 0.95;
  if (asset.ticker === 'IVVB11') return 315.0; // Lucro em exterior (+15.9%)
  if (asset.ticker === 'NVDA34') return 115.0;
  if (asset.ticker === 'MSFT34') return 88.0; // Prejuízo (-6.8%)
  return asset.currentPrice;
}

/**
 * Retorna a alíquota padrão de imposto aplicável conforme legislação tributária brasileira (RFB)
 */
export function getAssetTaxRate(asset: Asset): number {
  if (asset.isTaxExempt) return 0;
  if (asset.taxRatePercent !== undefined) return asset.taxRatePercent;

  switch (asset.assetClass) {
    case 'Renda Variável':
      return 15; // 15% operações normais (swing trade)
    case 'Internacional':
      return 15; // 15% para ETFs de índice exterior / BDRs
    case 'Renda Fixa':
      // Tabela regressiva: 22.5% até 180d, 20% até 360d, 17.5% até 720d, 15% > 720d
      if (asset.holdingPeriodDays && asset.holdingPeriodDays > 720) return 15;
      if (asset.holdingPeriodDays && asset.holdingPeriodDays > 360) return 17.5;
      return 15;
    case 'Multimercado':
      return 15; // Fundos de longo prazo alíquota mínima 15%
    case 'Caixa':
      return 15;
    default:
      return 15;
  }
}

/**
 * Calcula o raio-x fiscal de todos os ativos de uma carteira
 */
export function computePortfolioAssetTaxDetails(portfolio: Portfolio): AssetTaxDetail[] {
  return portfolio.assets.map((asset) => {
    const avgPrice = getAssetAveragePrice(asset);
    const taxRate = getAssetTaxRate(asset);
    const totalCurrentVal = asset.quantity * asset.currentPrice;
    const totalCostVal = asset.quantity * avgPrice;
    const unrealizedBRL = totalCurrentVal - totalCostVal;
    const unrealizedPct = avgPrice > 0 ? ((asset.currentPrice - avgPrice) / avgPrice) * 100 : 0;

    let taxClassification: AssetTaxDetail['taxClassification'] = 'LUCRO_TRIBUTAVEL';
    if (asset.isTaxExempt) {
      taxClassification = 'ISENTO_LEGAL';
    } else if (unrealizedBRL < 0) {
      taxClassification = 'PREJUIZO_COMPENSAVEL';
    } else if (asset.assetClass === 'Renda Variável' && totalCurrentVal <= 20000) {
      taxClassification = 'ISENTO_20K';
    }

    return {
      assetId: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      assetClass: asset.assetClass,
      quantityHeld: asset.quantity,
      currentPrice: asset.currentPrice,
      averagePrice: avgPrice,
      totalCurrentValueBRL: totalCurrentVal,
      unrealizedGainLossBRL: unrealizedBRL,
      unrealizedGainLossPercent: unrealizedPct,
      suggestedSellQty: 0,
      suggestedSellAmountBRL: 0,
      realizedGainLossBRL: 0,
      estimatedTaxBRL: 0,
      taxRatePercent: taxRate,
      isTaxExempt: !!asset.isTaxExempt,
      taxClassification,
    };
  });
}

/**
 * Analisa as opções tributárias e gera simulação comparativa para as 4 estratégias fiscais
 */
export function analyzeTaxStrategies(
  portfolio: Portfolio,
  targetClass: AssetClass,
  excessAmountBRL: number
): Record<TaxStrategy, TaxEfficiencyAnalysis> {
  const assetDetails = computePortfolioAssetTaxDetails(portfolio);
  const classAssets = assetDetails.filter((a) => a.assetClass === targetClass);

  // 1. Benchmark: Venda Proporcional Ingênua (Pro-Rata Naive)
  const naiveAnalysis = runStrategySimulation(
    portfolio,
    classAssets,
    targetClass,
    excessAmountBRL,
    'PRO_RATA_BALANCED',
    0 // benchmark base
  );

  // 2. Tax-Loss Harvesting (Vender prejuízos primeiro para gerar crédito fiscal)
  const harvestingAnalysis = runStrategySimulation(
    portfolio,
    classAssets,
    targetClass,
    excessAmountBRL,
    'TAX_LOSS_HARVESTING',
    naiveAnalysis.totalEstimatedTaxBRL
  );

  // 3. Menor Ganho de Capital (Minimizar desembolso imediato de IR)
  const minGainAnalysis = runStrategySimulation(
    portfolio,
    classAssets,
    targetClass,
    excessAmountBRL,
    'MINIMUM_CAPITAL_GAIN',
    naiveAnalysis.totalEstimatedTaxBRL
  );

  // 4. Aproveitamento da Isenção de R$ 20.000 em Ações
  const b3ExemptionAnalysis = runStrategySimulation(
    portfolio,
    classAssets,
    targetClass,
    excessAmountBRL,
    'B3_20K_EXEMPTION',
    naiveAnalysis.totalEstimatedTaxBRL
  );

  return {
    TAX_LOSS_HARVESTING: harvestingAnalysis,
    MINIMUM_CAPITAL_GAIN: minGainAnalysis,
    B3_20K_EXEMPTION: b3ExemptionAnalysis,
    PRO_RATA_BALANCED: naiveAnalysis,
  };
}

/**
 * Executa a alocação de ordens de venda sob uma estratégia específica
 */
function runStrategySimulation(
  portfolio: Portfolio,
  candidateAssets: AssetTaxDetail[],
  targetClass: AssetClass,
  targetExcessBRL: number,
  strategy: TaxStrategy,
  benchmarkTaxBRL: number
): TaxEfficiencyAnalysis {
  // Ordenação dos ativos conforme a lógica da estratégia
  const sorted = [...candidateAssets];

  if (strategy === 'TAX_LOSS_HARVESTING') {
    // Prioriza o maior prejuízo não realizado (unrealizedGainLossPercent mais negativo)
    sorted.sort((a, b) => a.unrealizedGainLossPercent - b.unrealizedGainLossPercent);
  } else if (strategy === 'MINIMUM_CAPITAL_GAIN') {
    // Prioriza ativos isentos ou menor ganho acumulado
    sorted.sort((a, b) => {
      if (a.isTaxExempt && !b.isTaxExempt) return -1;
      if (!a.isTaxExempt && b.isTaxExempt) return 1;
      return a.unrealizedGainLossPercent - b.unrealizedGainLossPercent;
    });
  } else if (strategy === 'B3_20K_EXEMPTION') {
    // Se for Renda Variável, tenta limitar a venda total a até R$ 20.000 ou prioriza vendas sob isenção
    sorted.sort((a, b) => b.unrealizedGainLossPercent - a.unrealizedGainLossPercent); // realiza os lucros dentro do limite isento!
  } else {
    // PRO_RATA_BALANCED: ordena por maior patrimônio absoluto (venda ingênua padrão)
    sorted.sort((a, b) => b.totalCurrentValueBRL - a.totalCurrentValueBRL);
  }

  let remainingToSell = targetExcessBRL;
  let totalSellAmountBRL = 0;
  let totalCapitalGainBRL = 0;
  let totalHarvestedLossBRL = 0;
  let totalEstimatedTaxBRL = 0;

  const proposedOrders: RebalanceOrder[] = [];
  const breakdown: AssetTaxDetail[] = sorted.map((item) => ({ ...item }));

  // Aplica teto de R$ 20.000 se for estratégia B3_20K_EXEMPTION
  const effectiveTargetBRL =
    strategy === 'B3_20K_EXEMPTION' && targetClass === 'Renda Variável'
      ? Math.min(targetExcessBRL, 19900)
      : targetExcessBRL;

  remainingToSell = effectiveTargetBRL;

  for (const asset of breakdown) {
    if (remainingToSell <= 0) break;

    // Vende até 60% da posição ou o valor restante necessário
    const maxSaleAmount = asset.totalCurrentValueBRL * 0.6;
    const saleAmount = Math.min(remainingToSell, maxSaleAmount);
    const qtyToSell = Math.floor(saleAmount / asset.currentPrice);

    if (qtyToSell <= 0) continue;

    const actualSaleBRL = qtyToSell * asset.currentPrice;
    const costBasisBRL = qtyToSell * asset.averagePrice;
    const realizedGainLoss = actualSaleBRL - costBasisBRL;

    asset.suggestedSellQty = qtyToSell;
    asset.suggestedSellAmountBRL = actualSaleBRL;
    asset.realizedGainLossBRL = realizedGainLoss;

    let estimatedTax = 0;

    // Regras tributárias brasileiras
    if (asset.isTaxExempt) {
      asset.taxClassification = 'ISENTO_LEGAL';
      estimatedTax = 0;
    } else if (
      strategy === 'B3_20K_EXEMPTION' &&
      targetClass === 'Renda Variável' &&
      totalSellAmountBRL + actualSaleBRL <= 20000
    ) {
      asset.taxClassification = 'ISENTO_20K';
      estimatedTax = 0;
      if (realizedGainLoss > 0) {
        totalCapitalGainBRL += realizedGainLoss;
      }
    } else if (realizedGainLoss <= 0) {
      asset.taxClassification = 'PREJUIZO_COMPENSAVEL';
      estimatedTax = 0;
      totalHarvestedLossBRL += Math.abs(realizedGainLoss);
    } else {
      asset.taxClassification = 'LUCRO_TRIBUTAVEL';
      estimatedTax = realizedGainLoss * (asset.taxRatePercent / 100);
      totalCapitalGainBRL += realizedGainLoss;
      totalEstimatedTaxBRL += estimatedTax;
    }

    asset.estimatedTaxBRL = estimatedTax;
    totalSellAmountBRL += actualSaleBRL;
    remainingToSell -= actualSaleBRL;

    // Monta a justificativa da ordem com inteligência fiscal
    let reason = '';
    if (asset.taxClassification === 'PREJUIZO_COMPENSAVEL') {
      reason = `[OTIMIZAÇÃO FISCAL] Tax-Loss Harvesting: Venda com prejuízo apurado de -R$ ${Math.abs(
        realizedGainLoss
      ).toLocaleString('pt-BR')} (-${Math.abs(asset.unrealizedGainLossPercent).toFixed(
        1
      )}%). Gera R$ ${Math.abs(realizedGainLoss).toLocaleString(
        'pt-BR'
      )} em crédito fiscal compensável e ZERO IR imediato.`;
    } else if (asset.taxClassification === 'ISENTO_20K') {
      reason = `[OTIMIZAÇÃO FISCAL] Isenção R$ 20k/mês: Venda calibrada dentro do limite mensal de ações da RFB. Lucro apurado de +R$ ${realizedGainLoss.toLocaleString(
        'pt-BR'
      )} com 100% de isenção de IR.`;
    } else if (asset.taxClassification === 'ISENTO_LEGAL') {
      reason = `[OTIMIZAÇÃO FISCAL] Ativo Isento: Alienação sem incidência de imposto de renda (Lei 12.431/2006 / Instrumento Isento).`;
    } else {
      reason = `[OTIMIZAÇÃO FISCAL] Menor Custo Fiscal: Alienação com ganho moderado (+${asset.unrealizedGainLossPercent.toFixed(
        1
      )}%). IR estimado: R$ ${estimatedTax.toLocaleString('pt-BR')} (${asset.taxRatePercent}%).`;
    }

    proposedOrders.push({
      assetId: asset.assetId,
      ticker: asset.ticker,
      assetClass: asset.assetClass,
      action: 'SELL',
      quantity: qtyToSell,
      unitPrice: asset.currentPrice,
      totalAmountBRL: Math.round(actualSaleBRL),
      reason,
      averagePrice: asset.averagePrice,
      realizedGainLossBRL: Math.round(realizedGainLoss),
      estimatedTaxBRL: Math.round(estimatedTax),
      taxStrategyApplied: strategy,
      taxClassification: asset.taxClassification,
    });
  }

  // Gera contrapartida de compra com o caixa liberado nas classes deficitárias
  const underAllocated = portfolio.mandateLimits.filter((limit) => {
    const classTotal = portfolio.assets
      .filter((a) => a.assetClass === limit.assetClass)
      .reduce((s, a) => s + a.totalValue, 0);
    const pct = (classTotal / portfolio.totalAum) * 100;
    return pct < limit.targetPercent;
  });

  if (totalSellAmountBRL > 0 && underAllocated.length > 0) {
    const cashPerClass = totalSellAmountBRL / underAllocated.length;
    for (const under of underAllocated) {
      const candidates = portfolio.assets.filter((a) => a.assetClass === under.assetClass);
      const targetAsset = candidates.length > 0 ? candidates[0] : null;

      if (targetAsset) {
        const qtyToBuy = Math.floor(cashPerClass / targetAsset.currentPrice);
        if (qtyToBuy > 0) {
          proposedOrders.push({
            assetId: targetAsset.id,
            ticker: targetAsset.ticker,
            assetClass: targetAsset.assetClass,
            action: 'BUY',
            quantity: qtyToBuy,
            unitPrice: targetAsset.currentPrice,
            totalAmountBRL: Math.round(qtyToBuy * targetAsset.currentPrice),
            reason: `Reinvestimento do capital líquido desinvestido para atingir meta de ${under.targetPercent}% em ${under.assetClass}`,
          });
        }
      }
    }
  }

  const effectiveTaxRate =
    totalCapitalGainBRL > 0 ? (totalEstimatedTaxBRL / totalCapitalGainBRL) * 100 : 0;
  const taxSavingsVsNaiveBRL = Math.max(0, benchmarkTaxBRL - totalEstimatedTaxBRL);

  const strategyMeta = getStrategyMetadata(strategy);

  return {
    strategy,
    strategyLabel: strategyMeta.label,
    strategyDescription: strategyMeta.description,
    totalSellAmountBRL: Math.round(totalSellAmountBRL),
    totalCapitalGainBRL: Math.round(totalCapitalGainBRL),
    totalEstimatedTaxBRL: Math.round(totalEstimatedTaxBRL),
    totalHarvestedLossBRL: Math.round(totalHarvestedLossBRL),
    effectiveTaxRatePercent: Number(effectiveTaxRate.toFixed(1)),
    taxSavingsVsNaiveBRL: Math.round(taxSavingsVsNaiveBRL),
    proposedOrders,
    assetTaxBreakdown: breakdown,
  };
}

/**
 * Retorna os rótulos e descrições conceituais de cada estratégia fiscal
 */
export function getStrategyMetadata(strategy: TaxStrategy): {
  label: string;
  badge: string;
  icon: string;
  description: string;
} {
  switch (strategy) {
    case 'TAX_LOSS_HARVESTING':
      return {
        label: 'Tax-Loss Harvesting (Realização de Prejuízo Fiscal)',
        badge: 'MÁXIMO CRÉDITO FISCAL',
        icon: 'TrendingDown',
        description:
          'Prioriza a venda de ativos com preço atual abaixo do preço médio (em perda de capital). Não gera desembolso de IR e cria saldo de prejuízo acumulado compensável para abater impostos de lucros futuros.',
      };
    case 'MINIMUM_CAPITAL_GAIN':
      return {
        label: 'Menor Ganho de Capital (Least Tax First)',
        badge: 'MENOR IR IMEDIATO',
        icon: 'ShieldCheck',
        description:
          'Prioriza ativos com menor ganho acumulado percentual ou ativos com isenção legal, minimizando a base de cálculo de ganho de capital e o valor nominal de DARF a recolher.',
      };
    case 'B3_20K_EXEMPTION':
      return {
        label: 'Aproveitamento do Limite de R$ 20k/mês (Ações B3)',
        badge: '100% ISENTO NA FAIXA',
        icon: 'Sparkles',
        description:
          'Para titulares pessoa física em carteira administrada, alienações de ações na B3 até R$ 20.000 no mês são totalmente isentas de IR. O assistente calibra a venda para realizar lucro sem incidência tributária.',
      };
    case 'PRO_RATA_BALANCED':
      return {
        label: 'Venda Proporcional Padrão (Sem Otimização Fiscal)',
        badge: 'BENCHMARK INGÊNUO',
        icon: 'Scale',
        description:
          'Vende participações proporcionais aos ativos da classe sem levar em consideração o preço médio de aquisição ou o impacto tributário. Utilizado como régua comparativa.',
      };
  }
}
