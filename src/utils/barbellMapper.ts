import { Asset } from '../types';

/**
 * GUIA DE MAPEAMENTO DA ESTRATÉGIA BARBELL
 * ========================================
 * Este módulo categoriza automaticamente os ativos reais do portfólio para os blocos da Estratégia Barbell.
 * A estratégia divide a alocação em:
 * 
 * 1. Ponta 1 (Curto Prazo / Liquidez e Defesa):
 *    - Foco em proteção absoluta e liquidez imediata.
 *    - Ativos: CDBs pós-fixados (ex: CDB ITAU BBA POS), fundos referenciados em CDI/Selic 
 *      (ex: SEL KINEA ATACAMA RF, OCCAM LIQUIDEZ), e fundos de crédito privado de curto prazo 
 *      (ex: DIF CP FICFI, ITAÚ CRÉD BANCÁRIO).
 * 
 * 2. Ponta 2 (Longo Prazo / Estrutural):
 *    - Foco em proteção contra inflação estrutural e ganho de capital (marcação a mercado).
 *    - Ativos: NTN-B longa, fundos de inflação (ex: ICATU VANGUARDA INFR).
 * 
 * 3. Miolo da Curva (Gestão Ativa / Crédito Médio):
 *    - Ativos que carregam risco de crédito ou duration intermediária.
 *    - Ativos: Fundos de Renda Fixa Ativo (ex: BTG PACTUAL RF SEL, VINLAND RF ATIVO SEL).
 * 
 * 4. Ações (Crescimento):
 *    - Renda variável local e global visando crescimento de longo prazo.
 * 
 * 5. Alternativos (Descorrelação / Proteção cambial):
 *    - Ativos em dólar (ex: SGOV, TFLO), fundos multimercados macro (ex: KINEA APOLO FIC MM, JGP CORPORATE PLUS).
 * 
 * REGRA ESTRITA:
 * Caso o ativo não apresente palavras-chave claras ou um setor reconhecido nos critérios acima,
 * a função retornará 'Não classificado' para evitar forçar enquadramentos imprecisos na visão do cliente.
 */

export function mapAssetToBarbellBlock(asset: Asset): { blockId: string | 'Não classificado', reason: string } {
  const nameLower = asset.name.toLowerCase();
  const tickerLower = asset.ticker.toLowerCase();
  const sectorLower = (asset.sector || '').toLowerCase();
  const assetClassLower = (asset.assetClass || '').toLowerCase();

  // 1. Ponta 1 (Liquidez e Pós-fixados)
  if (
    sectorLower === 'pós-fixado' || 
    nameLower.includes('liquidez') || 
    nameLower.includes('cdi') || 
    nameLower.includes('selic') || 
    nameLower.includes('cdb') ||
    tickerLower.includes('dif cp') ||
    tickerLower.includes('créd bancário') ||
    nameLower.includes('atacama rf')
  ) {
    return {
      blockId: 'ponta1',
      reason: 'Ativo classificado na Ponta 1 (Curto Prazo): Pós-fixado ou caixa com alta liquidez e baixo risco direcional.'
    };
  }

  // 2. Ponta 2 (Inflação / NTN-B longa)
  if (
    sectorLower === 'inflação' || 
    nameLower.includes('infr') || 
    nameLower.includes('ipca') || 
    nameLower.includes('ntn-b')
  ) {
    return {
      blockId: 'ponta2',
      reason: 'Ativo classificado na Ponta 2 (Longo Prazo): Exposição à inflação/juros reais estruturais.'
    };
  }

  // 3. Miolo da Curva (Renda Fixa Ativo, Crédito Privado Médio/Longo)
  if (
    sectorLower === 'renda fixa ativo' || 
    nameLower.includes('prefixado') ||
    nameLower.includes('ativo sel') // VINLAND RF ATIVO SEL
  ) {
    return {
      blockId: 'miolo',
      reason: 'Ativo classificado no Miolo da Curva: Renda fixa com gestão ativa, duration intermediária ou crédito.'
    };
  }

  // 4. Ações
  if (assetClassLower === 'renda variável' || sectorLower.includes('ações')) {
    return {
      blockId: 'acoes',
      reason: 'Ativo de Renda Variável focado em crescimento.'
    };
  }

  // 5. Alternativos (Multimercado, Offshore, Dólar)
  if (
    assetClassLower === 'multimercado' || 
    assetClassLower === 'internacional' ||
    nameLower.includes('dólar') || 
    tickerLower === 'sgov' || 
    tickerLower === 'tflo'
  ) {
    return {
      blockId: 'alternativos',
      reason: 'Ativo classificado como Alternativos/Offshore: Descorrelação, multimercados macro ou exposição cambial.'
    };
  }

  // Fallback Estrito
  return {
    blockId: 'Não classificado',
    reason: 'Não classificado: O ativo não atende aos critérios estritos da estratégia Barbell definidos no guia de mapeamento.'
  };
}
