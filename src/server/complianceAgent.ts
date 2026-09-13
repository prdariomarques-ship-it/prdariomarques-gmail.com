import {
  Portfolio,
  ComplianceAlert,
  AlertSeverity,
  AssetClass,
  RebalanceOrder,
  RuleSource,
  MandateLimit,
} from '../types';

export interface AllocationSummary {
  assetClass: AssetClass;
  currentValue: number;
  currentPercent: number;
  minPercent: number;
  targetPercent: number;
  maxPercent: number;
  deviationPP: number; // currentPercent - maxPercent (or minPercent - currentPercent)
  severity: AlertSeverity;
  ruleSource?: RuleSource;
  policyId?: string;
  tolerancePP?: number;
}

export class ComplianceAgent {
  /**
   * Calcula a distribuição atual de ativos por classe para a carteira especificada.
   */
  public static calculateAllocations(portfolio: Portfolio): AllocationSummary[] {
    const totalValue = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    const safeTotal = totalValue > 0 ? totalValue : portfolio.totalAum;

    // Agrupa valores por classe de ativo
    const classTotals: Record<AssetClass, number> = {
      'Renda Fixa': 0,
      'Renda Variável': 0,
      'Internacional': 0,
      'Multimercado': 0,
      'Caixa': 0,
    };

    for (const asset of portfolio.assets) {
      if (classTotals[asset.assetClass] !== undefined) {
        classTotals[asset.assetClass] += asset.totalValue;
      }
    }

    const summaries: AllocationSummary[] = [];

    for (const limit of portfolio.mandateLimits) {
      const currentVal = classTotals[limit.assetClass] || 0;
      const currentPct = safeTotal > 0 ? (currentVal / safeTotal) * 100 : 0;
      const roundedCurrentPct = Math.round(currentPct * 100) / 100;
      const criticalTolerance = limit.criticalTolerancePP ?? limit.tolerancePP ?? 5.0;
      const warningTolerance = limit.warningTolerancePP ?? 0.0;

      let severity: AlertSeverity = 'NORMAL';
      let deviationPP = 0;

      // Verificação com limites percentuais explícitos se configurados
      if (limit.criticalTriggerPercent !== undefined && roundedCurrentPct >= limit.criticalTriggerPercent) {
        severity = 'CRITICAL';
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
      } else if (limit.warningTriggerPercent !== undefined && roundedCurrentPct >= limit.warningTriggerPercent) {
        severity = 'WARNING';
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
      } else if (roundedCurrentPct > limit.maxPercent) {
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
        if (deviationPP > criticalTolerance) {
          severity = 'CRITICAL'; // Excesso acima da tolerância crítica
        } else {
          severity = 'WARNING'; // Excesso dentro da tolerância de warning
        }
      } else if (roundedCurrentPct < limit.minPercent) {
        // Alerta quando alocação cai abaixo do piso regulatório/mandato
        const underDeviation = Math.round((limit.minPercent - roundedCurrentPct) * 100) / 100;
        deviationPP = -underDeviation;
        if (underDeviation > criticalTolerance) {
          severity = 'CRITICAL';
        } else {
          severity = 'WARNING';
        }
      } else if (warningTolerance > 0 && roundedCurrentPct >= (limit.maxPercent - warningTolerance)) {
        // Alerta de Warning preventivo quando a alocação entra na margem de proximidade do teto
        severity = 'WARNING';
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
      }

      summaries.push({
        assetClass: limit.assetClass,
        currentValue: currentVal,
        currentPercent: roundedCurrentPct,
        minPercent: limit.minPercent,
        targetPercent: limit.targetPercent,
        maxPercent: limit.maxPercent,
        deviationPP,
        severity,
        ruleSource: limit.ruleSource || 'MANDATO_CLIENTE',
        policyId: limit.policyId || portfolio.assignedPolicyId || 'IPS-DEFAULT',
        tolerancePP: criticalTolerance,
      });
    }

    return summaries;
  }

  /**
   * Avalia a carteira e gera alertas detalhados de compliance com rigor técnico e separação estrita de fontes normativas.
   */
  public static evaluatePortfolio(portfolio: Portfolio): ComplianceAlert[] {
    const allocations = this.calculateAllocations(portfolio);
    const alerts: ComplianceAlert[] = [];
    const totalVal = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);

    for (const alloc of allocations) {
      if (alloc.severity === 'NORMAL') continue;

      const isOver = alloc.deviationPP > 0;
      const absDeviation = Math.abs(alloc.deviationPP);
      const ruleSource: RuleSource = alloc.ruleSource || 'MANDATO_CLIENTE';
      const policyId = alloc.policyId || 'IPS-DEFAULT';
      const tolerance = alloc.tolerancePP || 5.0;

      // Valor financeiro excedente ou deficitário
      const deviationBRL = (absDeviation / 100) * totalVal;
      // Valor para retornar ao alvo estipulado na política (target)
      const targetDiffPct = Math.abs(alloc.currentPercent - alloc.targetPercent);
      const targetTradeValue = (targetDiffPct / 100) * totalVal;

      let sourceDescriptor = '';
      let governanceNote = '';
      let mandateVsInternalExplanation = '';

      switch (ruleSource) {
        case 'MANDATO_CLIENTE':
          sourceDescriptor = `Mandato do Cliente (IPS - ${policyId})`;
          governanceNote = `Violação direta do Investment Policy Statement (IPS) celebrado formalmente com o cliente investidor.`;
          mandateVsInternalExplanation = `Diferença Fiduciária: O Mandato do Cliente (IPS) é um contrato bilateral legalmente vinculante entre o investidor e a gestora. Um desenquadramento de mandato constitui potencial quebra do dever fiduciário contratual perante o titular, exigindo rebalanceamento compulsório prioritário ou termo formal de alinhamento com o cliente. Diferente da Política Interna da gestora (que é uma diretriz de governança corporativa da casa), o Mandato vincula os direitos exclusivos e o perfil patrimonial contratado do cliente.`;
          break;
        case 'POLITICA_INTERNA':
          sourceDescriptor = `Política Interna da Gestora (${policyId})`;
          governanceNote = `Desvio em relação às diretrizes prudenciais do Comitê de Alocação e Risco interno da casa.`;
          mandateVsInternalExplanation = `Diferença Fiduciária: A Política Interna é um parâmetro prudencial de governança e controle de risco estabelecido pela própria gestora para mitigar riscos sistêmicos, liquidez e limites de concentração global. O desenquadramento não constitui necessariamente quebra direta de contrato com o cliente, mas sim uma inconformidade de governança corporativa que aciona o Comitê de Risco para deliberação de contingência ou enquadramento planejado.`;
          break;
        case 'REGRA_REGULATORIA':
          sourceDescriptor = `Regra Regulatória CVM/CMN (${policyId})`;
          governanceNote = `Violação formal de limite regulatório externo (Resolução CVM 175). Sujeito a notificação e prazo improrrogável de reenquadramento sob supervisão de custódia.`;
          mandateVsInternalExplanation = `Diferença Fiduciária: Regra legal imperativa estipulada pelo regulador de mercado (CVM/CMN). Prevalece hierarquicamente sobre o Mandato do Cliente e sobre as Políticas Internas da gestora, com prazos peremptórios de reenquadramento fixados pela regulamentação.`;
          break;
        case 'SUITABILITY':
          sourceDescriptor = `Suitability / Perfil do Cliente (${policyId})`;
          governanceNote = `Risco de desenquadramento de perfil de investidor (API / Resolução CVM 30). Requer reavaliação cadastral ou rebalanceamento preventivo.`;
          mandateVsInternalExplanation = `Diferença Fiduciária: Regra de adequação de perfil ao investidor (CVM 30 e Código ANBIMA). Limita a exposição máxima de risco permitida para a categoria do investidor perante o regulador e o mandato.`;
          break;
        default:
          sourceDescriptor = `Mandato de Investimento do Cliente (${policyId})`;
          governanceNote = `Desvio bilateral em relação ao contrato/IPS celebrado com o cliente.`;
          mandateVsInternalExplanation = `Diferença Fiduciária: O Mandato do Cliente vincula contratualmente a relação fiduciária entre o investidor e o gestor.`;
          break;
      }

      let message = '';
      let suggestedAction = '';

      if (isOver) {
        if (alloc.severity === 'CRITICAL') {
          message = `[${alloc.severity}] Desenquadramento em ${alloc.assetClass}: alocação atingiu ${alloc.currentPercent.toFixed(1)}% vs limite máximo de ${alloc.maxPercent.toFixed(1)}% (+${absDeviation.toFixed(1)} p.p. acima do teto; tolerância configurada: ${tolerance.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Venda disciplinada de aprox. R$ ${deviationBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em ${alloc.assetClass} para restaurar o teto, ou R$ ${targetTradeValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} para trazer ao target de ${alloc.targetPercent}%. Alocar o produto em Caixa/Renda Fixa.`;
        } else {
          message = `[${alloc.severity}] Alerta de tolerância em ${alloc.assetClass}: alocação em ${alloc.currentPercent.toFixed(1)}% superou o limite de ${alloc.maxPercent.toFixed(1)}% em +${absDeviation.toFixed(1)} p.p., dentro da faixa de tolerância de ${tolerance.toFixed(1)} p.p. Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Programar redução compensatória de R$ ${deviationBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ou direcionar novas contribuições a classes subalocadas.`;
        }
      } else {
        if (alloc.severity === 'CRITICAL') {
          message = `[${alloc.severity}] Subalocação crítica em ${alloc.assetClass}: alocação em ${alloc.currentPercent.toFixed(1)}% está abaixo do piso obrigatório de ${alloc.minPercent.toFixed(1)}% (-${absDeviation.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Aporte ou compra planejada de aprox. R$ ${deviationBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em ${alloc.assetClass} para retornar ao patamar mínimo.`;
        } else {
          message = `[${alloc.severity}] Alerta de piso em ${alloc.assetClass}: alocação em ${alloc.currentPercent.toFixed(1)}% está ligeiramente abaixo do piso de ${alloc.minPercent.toFixed(1)}% (-${absDeviation.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Priorizar alocação de proventos ou caixa ocioso em ativos desta classe.`;
        }
      }

      // Explicação estruturada de IA padronizada
      const aiExplanation = {
        what: `A exposição em ${alloc.assetClass} atingiu ${alloc.currentPercent.toFixed(1)}% do patrimônio líquido, ultrapassando a marca estipulada de ${isOver ? alloc.maxPercent.toFixed(1) : alloc.minPercent.toFixed(1)}% em ${absDeviation.toFixed(1)} p.p.`,
        why: `Variação de mercado e rendimento acumulado dos ativos componentes aumentaram a participação relativa da classe de forma desproporcional sem intervenção recente de caixa.`,
        impact: `${governanceNote} Risco estimado de volatilidade adicional e impacto no tracking error em relação ao benchmark ${portfolio.benchmark}.`,
        action: suggestedAction,
        confidence: alloc.severity === 'CRITICAL' ? 97 : 91,
        source: `${sourceDescriptor} • Vigência: 2026`,
      };

      alerts.push({
        id: `alt-${portfolio.id}-${alloc.assetClass.toLowerCase().replace(/[\s/]/g, '-')}`,
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        clientName: portfolio.clientName,
        assetClass: alloc.assetClass,
        currentPercent: alloc.currentPercent,
        targetPercent: alloc.targetPercent,
        maxPercent: alloc.maxPercent,
        minPercent: alloc.minPercent,
        deviationPP: alloc.deviationPP,
        severity: alloc.severity,
        message,
        suggestedAction,
        excessValueBRL: Math.round(deviationBRL),
        recommendedTradeValue: Math.round(targetTradeValue),
        timestamp: new Date().toLocaleDateString('pt-BR'),
        ruleSource,
        policyId,
        limit: isOver ? alloc.maxPercent : alloc.minPercent,
        currentValue: alloc.currentPercent,
        rule_source: ruleSource,
        policy_id: policyId,
        current_value: alloc.currentPercent,
        difference: alloc.deviationPP,
        effectiveDate: '01/01/2026',
        tolerancePP: tolerance,
        mandateVsInternalExplanation,
        aiExplanation,
      });
    }

    return alerts;
  }

  /**
   * Avalia todas as carteiras e retorna a lista consolidada de alertas de compliance.
   * Atende diretamente ao endpoint GET /api/alerts.
   */
  public static evaluateAllPortfolios(portfolios: Portfolio[]): ComplianceAlert[] {
    const allAlerts: ComplianceAlert[] = [];
    for (const portfolio of portfolios) {
      const alerts = this.evaluatePortfolio(portfolio);
      allAlerts.push(...alerts);
    }

    // Ordena alertas: CRITICAL primeiro, depois WARNING
    return allAlerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
      return Math.abs(b.deviationPP) - Math.abs(a.deviationPP);
    });
  }

  /**
   * Determina o status consolidado de uma carteira (CRITICAL se houver qualquer alerta crítico, WARNING se houver aviso, senão NORMAL).
   */
  public static getPortfolioOverallSeverity(portfolio: Portfolio): AlertSeverity {
    const alerts = this.evaluatePortfolio(portfolio);
    if (alerts.some((a) => a.severity === 'CRITICAL')) return 'CRITICAL';
    if (alerts.some((a) => a.severity === 'WARNING')) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Gera uma proposta detalhada de ordens de rebalanceamento (boletas) para reenquadrar a carteira ao target ou limite aceitável.
   */
  public static generateRebalancePlan(portfolio: Portfolio): RebalanceOrder[] {
    const allocations = this.calculateAllocations(portfolio);
    const totalVal = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    const orders: RebalanceOrder[] = [];

    // Localiza classes excedentes
    const overAllocated = allocations.filter((a) => a.deviationPP > 0);
    // Localiza classes deficitárias ou Caixa
    const underAllocated = allocations.filter((a) => a.currentPercent < a.targetPercent);

    let totalFreedCash = 0;

    for (const over of overAllocated) {
      // Queremos trazer para a targetPercent
      const excessPct = over.currentPercent - over.targetPercent;
      const excessBRL = (excessPct / 100) * totalVal;
      let remainingToSell = excessBRL;

      // Seleciona ativos da classe para venda
      const classAssets = portfolio.assets
        .filter((a) => a.assetClass === over.assetClass)
        .sort((a, b) => b.totalValue - a.totalValue);

      for (const asset of classAssets) {
        if (remainingToSell <= 0) break;
        const sellAmount = Math.min(remainingToSell, asset.totalValue * 0.4); // Vende até 40% da posição para não zerar
        const qtyToSell = Math.floor(sellAmount / asset.currentPrice);
        if (qtyToSell > 0) {
          const tradeBRL = qtyToSell * asset.currentPrice;
          remainingToSell -= tradeBRL;
          totalFreedCash += tradeBRL;

          orders.push({
            assetId: asset.id,
            ticker: asset.ticker,
            assetClass: asset.assetClass,
            action: 'SELL',
            quantity: qtyToSell,
            unitPrice: asset.currentPrice,
            totalAmountBRL: Math.round(tradeBRL),
            reason: `Venda para redução da classe ${over.assetClass} (${over.currentPercent.toFixed(1)}% -> meta ${over.targetPercent.toFixed(1)}%)`,
          });
        }
      }
    }

    // Aloca o caixa liberado nas classes deficitárias
    if (totalFreedCash > 0 && underAllocated.length > 0) {
      const perClassCash = totalFreedCash / underAllocated.length;
      for (const under of underAllocated) {
        const classAssets = portfolio.assets.filter((a) => a.assetClass === under.assetClass);
        const targetAsset = classAssets.length > 0 ? classAssets[0] : null;

        if (targetAsset) {
          const qtyToBuy = Math.floor(perClassCash / targetAsset.currentPrice);
          if (qtyToBuy > 0) {
            orders.push({
              assetId: targetAsset.id,
              ticker: targetAsset.ticker,
              assetClass: targetAsset.assetClass,
              action: 'BUY',
              quantity: qtyToBuy,
              unitPrice: targetAsset.currentPrice,
              totalAmountBRL: Math.round(qtyToBuy * targetAsset.currentPrice),
              reason: `Aporte compensatório para elevar ${under.assetClass} em direção à meta de ${under.targetPercent}%`,
            });
          }
        }
      }
    }

    return orders;
  }
}
