var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");

// src/server/portfolioRepo.ts
var initialPolicies = [
  {
    id: "IPS-AW-001",
    code: "IPS-AW-001",
    name: "Mandato Bilateral Carteira Miguel (IPS Registrado)",
    type: "MANDATO_CLIENTE",
    version: "v2.4",
    effectiveDate: "01/01/2026",
    description: "Declara\xE7\xE3o formal de pol\xEDtica de investimentos (IPS) acordada bilateralmente com o titular e arquivada para fins de auditoria.",
    status: "ACTIVE",
    rules: [
      {
        id: "rul-aw-01",
        policyId: "IPS-AW-001",
        assetClass: "Renda Vari\xE1vel",
        profile: "Moderado",
        minPercent: 10,
        targetPercent: 25,
        maxPercent: 35,
        tolerancePP: 5,
        source: "MANDATO_CLIENTE",
        strictness: "HARD_STOP",
        effectiveDate: "01/01/2026",
        description: "Teto m\xE1ximo de a\xE7\xF5es locais estipulado no mandato do cliente Miguel."
      },
      {
        id: "rul-aw-02",
        policyId: "IPS-AW-001",
        assetClass: "Renda Fixa",
        profile: "Moderado",
        minPercent: 40,
        targetPercent: 50,
        maxPercent: 65,
        tolerancePP: 5,
        source: "MANDATO_CLIENTE",
        strictness: "HARD_STOP",
        effectiveDate: "01/01/2026"
      },
      {
        id: "rul-aw-03",
        policyId: "IPS-AW-001",
        assetClass: "Caixa",
        profile: "Moderado",
        minPercent: 2,
        targetPercent: 5,
        maxPercent: 10,
        tolerancePP: 2,
        source: "MANDATO_CLIENTE",
        strictness: "WARNING_TOLERANCE",
        effectiveDate: "01/01/2026"
      }
    ]
  },
  {
    id: "POL-PREV-001",
    code: "POL-HORIZON-PREV",
    name: "Diretriz Interna de Aloca\xE7\xE3o e Risco Previdenci\xE1rio",
    type: "POLITICA_INTERNA",
    version: "v3.1",
    effectiveDate: "15/12/2025",
    description: "Manual interno de risco e aloca\xE7\xE3o do comit\xEA de investimentos para mandatos de previd\xEAncia PGBL/VGBL.",
    status: "ACTIVE",
    rules: [
      {
        id: "rul-hz-01",
        policyId: "POL-HORIZON-PREV",
        assetClass: "Multimercado",
        profile: "Conservador",
        minPercent: 0,
        targetPercent: 10,
        maxPercent: 15,
        tolerancePP: 3,
        source: "POLITICA_INTERNA",
        strictness: "WARNING_TOLERANCE",
        effectiveDate: "15/12/2025",
        description: "Limite interno da gestora para exposi\xE7\xE3o a fundos multimercados."
      }
    ]
  },
  {
    id: "CVM-175-ANEXO-I",
    code: "CVM-175-ANEXO-I",
    name: "Resolu\xE7\xE3o CVM 175 - Limites de Ativos no Exterior & Liquidez",
    type: "REGRA_REGULATORIA",
    version: "Res. CVM 175",
    effectiveDate: "02/10/2023",
    description: "Regulamenta\xE7\xE3o geral de fundos de investimento e carteiras administradas pela CVM, Anexo Normativo I.",
    status: "ACTIVE",
    rules: [
      {
        id: "rul-cvm-01",
        policyId: "CVM-175-ANEXO-I",
        assetClass: "Internacional",
        profile: "Arrojado",
        minPercent: 0,
        targetPercent: 20,
        maxPercent: 25,
        tolerancePP: 5,
        source: "REGRA_REGULATORIA",
        strictness: "HARD_STOP",
        effectiveDate: "02/10/2023",
        description: "Teto de 25% para investidores qualificados sem anexo espec\xEDfico de exterior."
      }
    ]
  },
  {
    id: "RES-CMN-4963-RPPS",
    code: "RES-CMN-4963-RPPS",
    name: "Resolu\xE7\xE3o CMN n\xBA 4.963/2021 - Aplica\xE7\xF5es dos Regimes Pr\xF3prios (RPPS)",
    type: "REGRA_REGULATORIA",
    version: "CMN 4.963",
    effectiveDate: "25/11/2021",
    description: "Diretrizes do Conselho Monet\xE1rio Nacional para limites de aloca\xE7\xE3o de recursos previdenci\xE1rios de servidores p\xFAblicos.",
    status: "ACTIVE",
    rules: [
      {
        id: "rul-rpps-01",
        policyId: "RES-CMN-4963-RPPS",
        assetClass: "Renda Vari\xE1vel",
        profile: "Moderado",
        minPercent: 15,
        targetPercent: 25,
        maxPercent: 35,
        tolerancePP: 3.5,
        source: "REGRA_REGULATORIA",
        strictness: "HARD_STOP",
        effectiveDate: "25/11/2021",
        description: "Teto de aloca\xE7\xE3o em a\xE7\xF5es e \xEDndices para RPPS no segmento de renda vari\xE1vel."
      }
    ]
  },
  {
    id: "SUIT-MODERADO-V2",
    code: "SUIT-MODERADO-V2",
    name: "Matriz de Adequa\xE7\xE3o de Suitability CVM 30 - Moderado",
    type: "SUITABILITY",
    version: "v2.0",
    effectiveDate: "01/06/2024",
    description: "Limites de risco para perfil de investidor Moderado conforme regras de suitability da CVM e ANBIMA.",
    status: "ACTIVE",
    rules: [
      {
        id: "rul-suit-01",
        policyId: "SUIT-MODERADO-V2",
        assetClass: "Renda Vari\xE1vel",
        profile: "Moderado",
        minPercent: 0,
        targetPercent: 20,
        maxPercent: 35,
        tolerancePP: 5,
        source: "SUITABILITY",
        strictness: "HARD_STOP",
        effectiveDate: "01/06/2024"
      }
    ]
  }
];
var initialPortfolios = [
  {
    id: "port-miguel-001",
    name: "Carteira Miguel",
    clientName: "Miguel",
    code: "MIGUEL-001",
    manager: "",
    profile: "Arrojado",
    benchmark: "CDI",
    totalAum: 39990169e-1,
    cashBalance: 0,
    lastRebalanced: "",
    status: "NORMAL",
    assignedPolicyId: void 0,
    mandateLimits: [],
    assets: [
      // ── Pós-fixado — 9 produtos, R$ 3.028.755,91 (Itaú) ──
      {
        id: "ast-miguel-52678",
        ticker: "52678",
        name: "DIF CP FICFI",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 25362.95,
        currentPrice: 30.88711,
        totalValue: 783388.21,
        allocationPercent: 19.59,
        cnpj: "20.335.522/0001-51",
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-56732",
        ticker: "56732",
        name: "ITA\xDA CR\xC9D BANC\xC1RIO",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 402846.98,
        currentPrice: 1.4612,
        totalValue: 588640,
        allocationPercent: 14.72,
        cnpj: "51.998.694/0001-39",
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-56855",
        ticker: "56855",
        name: "OCCAM LIQUIDEZ",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 293187.23,
        currentPrice: 1.750704,
        totalValue: 513284.04,
        allocationPercent: 12.84,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-59138",
        ticker: "59138",
        name: "SEL KINEA ATACAMA RF",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 465508.63,
        currentPrice: 1.039109,
        totalValue: 483714.18,
        allocationPercent: 12.1,
        cnpj: "08.604.187/0001-44",
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-58336",
        ticker: "58336",
        name: "MAPFRE CONFIANZA RF",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 204466.5,
        currentPrice: 1.505606,
        totalValue: 307845.95,
        allocationPercent: 7.7,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-57559",
        ticker: "57559",
        name: "BTG PACTUAL CORP SEL",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 195142.28,
        currentPrice: 1.307091,
        totalValue: 255068.71,
        allocationPercent: 6.38,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-58989",
        ticker: "58989",
        name: "ITA\xDA SELE\xC7\xC3O IBIUNA",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 86203.35,
        currentPrice: 1.063998,
        totalValue: 91720.18,
        allocationPercent: 2.29,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-54170",
        ticker: "54170",
        name: "JGP SELECT FICFI MM",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 253.5,
        currentPrice: 20.093145,
        totalValue: 5093.56,
        allocationPercent: 0.13,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-atenas",
        ticker: "ATENAS-VGBL",
        name: "Itau Absolute Atenas Prev Rf Cp Vgbl",
        assetClass: "Renda Fixa",
        sector: "P\xF3s-fixado",
        quantity: 0.69,
        currentPrice: 1.564843,
        totalValue: 1.08,
        allocationPercent: 0,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      // ── Renda Fixa Ativo — 3 produtos, R$ 462.390,45 (Itaú) ──
      {
        id: "ast-miguel-56294",
        ticker: "56294",
        name: "BTG PACTUAL RF SEL",
        assetClass: "Renda Fixa",
        sector: "Renda Fixa Ativo",
        quantity: 170721.21,
        currentPrice: 1.498636,
        totalValue: 255848.95,
        allocationPercent: 6.4,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-58343",
        ticker: "58343",
        name: "VINLAND RF ATIVO SEL",
        assetClass: "Renda Fixa",
        sector: "Renda Fixa Ativo",
        quantity: 137387.82,
        currentPrice: 1.119348,
        totalValue: 153784.76,
        allocationPercent: 3.85,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-50246",
        ticker: "50246",
        name: "ITA\xDA BTG PACTUAL RF",
        assetClass: "Renda Fixa",
        sector: "Renda Fixa Ativo",
        quantity: 882.48,
        currentPrice: 59.782514,
        totalValue: 52756.74,
        allocationPercent: 1.32,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      // ── Inflação — 1 produto, R$ 152.171,68 (Itaú) ──
      {
        id: "ast-miguel-56081",
        ticker: "56081",
        name: "ICATU VANGUARDA INFR",
        assetClass: "Renda Fixa",
        sector: "Infla\xE7\xE3o",
        quantity: 106647.95,
        currentPrice: 1.42686,
        totalValue: 152171.68,
        allocationPercent: 3.81,
        productType: "asset_gestora",
        isTaxExempt: true,
        taxExemptionReason: "Fundo de Deb\xEAntures Incentivadas"
      },
      // ── Multimercado — 2 produtos, R$ 105.106,46 (Itaú) ──
      {
        id: "ast-miguel-54430",
        ticker: "54430",
        name: "KINEA APOLO FIC MM",
        assetClass: "Multimercado",
        sector: "Multimercado",
        quantity: 5305.25,
        currentPrice: 18.84927,
        totalValue: 1e5,
        allocationPercent: 2.5,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-54169",
        ticker: "54169",
        name: "JGP CORPORATE PLUS",
        assetClass: "Multimercado",
        sector: "Multimercado",
        quantity: 251.27,
        currentPrice: 20.322752,
        totalValue: 5106.46,
        allocationPercent: 0.13,
        productType: "asset_gestora",
        isTaxExempt: false
      },
      // ── Avenue (offshore, USD convertido a 5,27) — 2 produtos ──
      {
        id: "ast-miguel-sgov",
        ticker: "SGOV",
        name: "iShares 0-3 Month Treasury Bond ETF",
        assetClass: "Internacional",
        sector: "Avenue \u2014 orig. US$ 24.965,80 @ 5,27",
        quantity: 248,
        currentPrice: 529.8458,
        averagePrice: 530.5836,
        totalValue: 131569.77,
        unrealizedGainBRL: -183.19,
        unrealizedGainPercent: -0.13,
        allocationPercent: 3.29,
        productType: "corretora",
        isTaxExempt: false
      },
      {
        id: "ast-miguel-tflo",
        ticker: "TFLO",
        name: "iShares Treasury Floating Rate Bond ETF",
        assetClass: "Internacional",
        sector: "Avenue \u2014 orig. US$ 22.584,94 @ 5,27",
        quantity: 447,
        currentPrice: 266.5566,
        averagePrice: 266.9255,
        totalValue: 119022.63,
        unrealizedGainBRL: -164.69,
        unrealizedGainPercent: -0.13,
        allocationPercent: 2.98,
        productType: "corretora",
        isTaxExempt: false
      }
    ]
  }
];
var storePortfolios = JSON.parse(JSON.stringify(initialPortfolios));
var storePolicies = JSON.parse(JSON.stringify(initialPolicies));
function getPortfoliosRepo() {
  return storePortfolios;
}
function getPortfolioByIdRepo(id) {
  return storePortfolios.find((p) => p.id === id);
}
function updatePortfolioRepo(updated) {
  const index = storePortfolios.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    storePortfolios[index] = updated;
  }
}
function resetPortfoliosRepo() {
  storePortfolios = JSON.parse(JSON.stringify(initialPortfolios));
  return storePortfolios;
}
function simulateMarketShockRepo(targetPortfolioId) {
  let target = storePortfolios.find((p) => p.id === (targetPortfolioId || "port-004"));
  if (!target) {
    target = storePortfolios[0];
  }
  const equityAssets = target.assets.filter((a) => a.assetClass === "Renda Vari\xE1vel");
  const targetAsset = equityAssets.length > 0 ? equityAssets[0] : target.assets[0];
  const previousAllocation = targetAsset.allocationPercent;
  targetAsset.currentPrice = Math.round(targetAsset.currentPrice * 1.8 * 100) / 100;
  targetAsset.totalValue = targetAsset.quantity * targetAsset.currentPrice;
  const newTotalAum = target.assets.reduce((sum, a) => sum + a.totalValue, 0);
  target.totalAum = newTotalAum;
  for (const a of target.assets) {
    a.allocationPercent = Math.round(a.totalValue / newTotalAum * 1e4) / 100;
  }
  target.status = "CRITICAL";
  const newAllocation = targetAsset.allocationPercent;
  return {
    success: true,
    portfolio: target,
    affectedAsset: targetAsset.ticker,
    previousPercent: previousAllocation,
    newPercent: newAllocation
  };
}
function getPoliciesRepo() {
  return storePolicies;
}
function getPolicyByIdRepo(id) {
  return storePolicies.find((p) => p.id === id);
}
var defaultAssetClassThresholds = [
  {
    assetClass: "Renda Vari\xE1vel",
    minPercent: 10,
    targetPercent: 25,
    maxPercent: 35,
    warningTolerancePP: 2,
    criticalTolerancePP: 5,
    warningTriggerPercent: 33,
    criticalTriggerPercent: 40,
    sourceDescription: "Mandato Bilateral IPS & CVM 175",
    notes: "A\xE7\xF5es B3, ETFs locais, BDRs N\xEDvel I/II"
  },
  {
    assetClass: "Renda Fixa",
    minPercent: 40,
    targetPercent: 50,
    maxPercent: 65,
    warningTolerancePP: 3,
    criticalTolerancePP: 5,
    warningTriggerPercent: 62,
    criticalTriggerPercent: 70,
    sourceDescription: "Resolu\xE7\xE3o CMN 4.963 / ANBIMA",
    notes: "T\xEDtulos p\xFAblicos federais, Deb\xEAntures incentivadas, CDBs"
  },
  {
    assetClass: "Internacional",
    minPercent: 0,
    targetPercent: 15,
    maxPercent: 20,
    warningTolerancePP: 2,
    criticalTolerancePP: 5,
    warningTriggerPercent: 18,
    criticalTriggerPercent: 25,
    sourceDescription: "Resolu\xE7\xE3o CVM 175 Anexo I (Teto Geral 20%)",
    notes: "ETFs globais, fundos offshore 332, ADRs"
  },
  {
    assetClass: "Multimercado",
    minPercent: 0,
    targetPercent: 10,
    maxPercent: 15,
    warningTolerancePP: 2,
    criticalTolerancePP: 3,
    warningTriggerPercent: 13,
    criticalTriggerPercent: 18,
    sourceDescription: "Diretriz Interna de Risco & Aloca\xE7\xE3o",
    notes: "Fundos Macro, Quantitativos, Long & Short"
  },
  {
    assetClass: "Caixa",
    minPercent: 2,
    targetPercent: 5,
    maxPercent: 10,
    warningTolerancePP: 1,
    criticalTolerancePP: 2,
    warningTriggerPercent: 9,
    criticalTriggerPercent: 12,
    sourceDescription: "Gest\xE3o de Liquidez & Disponibilidades",
    notes: "Opera\xE7\xF5es compromissadas overnight, CDI di\xE1rio"
  }
];
var storeAssetClassThresholds = JSON.parse(
  JSON.stringify(defaultAssetClassThresholds)
);
function getLimitsConfigRepo(portfolioId) {
  if (portfolioId && portfolioId !== "all") {
    const portfolio = storePortfolios.find((p) => p.id === portfolioId);
    if (portfolio && portfolio.mandateLimits.length > 0) {
      return portfolio.mandateLimits.map((ml) => {
        const base = storeAssetClassThresholds.find((t) => t.assetClass === ml.assetClass);
        return {
          assetClass: ml.assetClass,
          minPercent: ml.minPercent,
          targetPercent: ml.targetPercent,
          maxPercent: ml.maxPercent,
          warningTolerancePP: ml.warningTolerancePP ?? base?.warningTolerancePP ?? 2,
          criticalTolerancePP: ml.criticalTolerancePP ?? ml.tolerancePP ?? base?.criticalTolerancePP ?? 5,
          warningTriggerPercent: ml.warningTriggerPercent ?? (base?.warningTriggerPercent ?? ml.maxPercent - 2),
          criticalTriggerPercent: ml.criticalTriggerPercent ?? (base?.criticalTriggerPercent ?? ml.maxPercent + (ml.tolerancePP ?? 5)),
          sourceDescription: base?.sourceDescription,
          notes: base?.notes
        };
      });
    }
  }
  return storeAssetClassThresholds;
}
function updateLimitsConfigRepo(configs, portfolioId) {
  storeAssetClassThresholds = JSON.parse(JSON.stringify(configs));
  for (const port of storePortfolios) {
    if (!portfolioId || portfolioId === "all" || port.id === portfolioId) {
      for (const cfg of configs) {
        const existingLimit = port.mandateLimits.find((l) => l.assetClass === cfg.assetClass);
        if (existingLimit) {
          existingLimit.minPercent = cfg.minPercent;
          existingLimit.targetPercent = cfg.targetPercent;
          existingLimit.maxPercent = cfg.maxPercent;
          existingLimit.warningTolerancePP = cfg.warningTolerancePP;
          existingLimit.criticalTolerancePP = cfg.criticalTolerancePP;
          existingLimit.tolerancePP = cfg.criticalTolerancePP;
          existingLimit.warningTriggerPercent = cfg.warningTriggerPercent;
          existingLimit.criticalTriggerPercent = cfg.criticalTriggerPercent;
        } else {
          port.mandateLimits.push({
            assetClass: cfg.assetClass,
            minPercent: cfg.minPercent,
            targetPercent: cfg.targetPercent,
            maxPercent: cfg.maxPercent,
            tolerancePP: cfg.criticalTolerancePP,
            warningTolerancePP: cfg.warningTolerancePP,
            criticalTolerancePP: cfg.criticalTolerancePP,
            warningTriggerPercent: cfg.warningTriggerPercent,
            criticalTriggerPercent: cfg.criticalTriggerPercent,
            ruleSource: "POLITICA_INTERNA"
          });
        }
      }
    }
  }
  return storePortfolios;
}
function resetLimitsConfigRepo() {
  storeAssetClassThresholds = JSON.parse(JSON.stringify(defaultAssetClassThresholds));
  return storeAssetClassThresholds;
}

// src/server/notificationChannelsRepo.ts
function maskEmail(email) {
  if (!email || !email.includes("@")) return "c***e@FlowCore.investments";
  const parts = email.split("@");
  const user = parts[0];
  const domain = parts[1];
  if (user.length <= 2) {
    return `${user[0] || "*"}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
function maskPhoneNumber(phone) {
  if (!phone) return "+55 (11) *****-5678";
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length < 6) return "+55 (11) *****-****";
  const lastFour = clean.slice(-4);
  return `+55 (**) *****-${lastFour}`;
}
var DEFAULT_OFFICE_ID = "office-matriz-01";
var officeSettingsMap = /* @__PURE__ */ new Map();
function createDefaultSettings(officeId = DEFAULT_OFFICE_ID) {
  return {
    officeId,
    email: {
      enabled: true,
      recipient: "compliance.officer@FlowCore.investments",
      sendOnCriticalOnly: true,
      includeReportAttachment: true,
      scheduledReportEnabled: true,
      scheduledReportTime: "08:00",
      scheduledReportCron: "0 8 * * *",
      severitiesFilter: ["CRITICAL", "WARNING"],
      assetClassesFilter: ["Renda Fixa", "Renda Vari\xE1vel", "Internacional", "Multimercado", "Caixa"]
    },
    sms: {
      enabled: true,
      phoneNumber: "+55 (11) 91234-5678",
      sendOnCriticalOnly: true
    },
    inAppAudio: true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
officeSettingsMap.set(DEFAULT_OFFICE_ID, createDefaultSettings(DEFAULT_OFFICE_ID));
var currentSettings = officeSettingsMap.get(DEFAULT_OFFICE_ID);
var dispatchLogs = [
  {
    id: "disp-init-01",
    channel: "EMAIL",
    recipient: maskEmail("compliance.officer@FlowCore.investments"),
    status: "SENT",
    subjectOrTitle: "[FlowCore ALERTA CR\xCDTICO] Carteira Alpha Privada (PORT-001) - Desenquadramento CVM 175",
    bodyPreview: "Alerta Cr\xEDtico: Renda Vari\xE1vel atingiu 43.5% (limite m\xE1x de 35.0%, desvio +8.5 p.p.). Excesso de R$ 510.000 detectado pelo Sentinel. A\xE7\xE3o fiduci\xE1ria: Realizar venda parcial para rebalancear.",
    sentAt: "09:30:15",
    alertId: "alert-001",
    portfolioName: "Carteira Alpha Privada",
    severity: "CRITICAL"
  },
  {
    id: "disp-init-02",
    channel: "SMS",
    recipient: maskPhoneNumber("+55 (11) 91234-5678"),
    status: "SENT",
    subjectOrTitle: "FlowCore SMS URGENTE: PORT-001",
    bodyPreview: "URGENTE: Carteira Alpha Privada excedeu teto de Renda Vari\xE1vel (+8.5 p.p. / R$ 510k). Acesse o portal FlowCore para rebalanceamento.",
    sentAt: "09:30:15",
    alertId: "alert-001",
    portfolioName: "Carteira Alpha Privada",
    severity: "CRITICAL"
  }
];
function getNotificationSettingsRepo(options) {
  const targetOfficeId = options?.officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  if (!officeSettingsMap.has(targetOfficeId)) {
    officeSettingsMap.set(targetOfficeId, createDefaultSettings(targetOfficeId));
  }
  const settings = officeSettingsMap.get(targetOfficeId);
  if (options?.unmasked) {
    return { ...settings };
  }
  return {
    ...settings,
    email: {
      ...settings.email,
      recipient: maskEmail(settings.email.recipient)
    },
    sms: {
      ...settings.sms,
      phoneNumber: maskPhoneNumber(settings.sms.phoneNumber)
    }
  };
}
function updateNotificationSettingsRepo(newSettings, officeId) {
  const targetOfficeId = officeId || newSettings.officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  if (!officeSettingsMap.has(targetOfficeId)) {
    officeSettingsMap.set(targetOfficeId, createDefaultSettings(targetOfficeId));
  }
  let target = officeSettingsMap.get(targetOfficeId);
  let targetEmail = target.email.recipient;
  if (newSettings.email?.recipient && !newSettings.email.recipient.includes("***")) {
    targetEmail = newSettings.email.recipient.trim();
  }
  let targetPhone = target.sms.phoneNumber;
  if (newSettings.sms?.phoneNumber && !newSettings.sms.phoneNumber.includes("***")) {
    targetPhone = newSettings.sms.phoneNumber.trim();
  }
  const updated = {
    ...target,
    ...newSettings,
    officeId: targetOfficeId,
    email: {
      ...target.email,
      ...newSettings.email || {},
      recipient: targetEmail
    },
    sms: {
      ...target.sms,
      ...newSettings.sms || {},
      phoneNumber: targetPhone
    },
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  officeSettingsMap.set(targetOfficeId, updated);
  if (targetOfficeId === (currentSettings.officeId || DEFAULT_OFFICE_ID)) {
    currentSettings = updated;
  }
  return getNotificationSettingsRepo({ unmasked: false, officeId: targetOfficeId });
}
function getSecondaryDispatchLogsRepo() {
  return [...dispatchLogs].sort((a, b) => b.id.localeCompare(a.id));
}
function clearSecondaryDispatchLogsRepo() {
  dispatchLogs = [];
}
function dispatchSecondaryAlertsRepo(alerts) {
  const settings = currentSettings;
  const newLogs = [];
  const timeFormatted = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  for (const alert of alerts) {
    const severitiesFilter = settings.email.severitiesFilter || ["CRITICAL", "WARNING", "NORMAL"];
    const assetClassesFilter = settings.email.assetClassesFilter || ["Renda Fixa", "Renda Vari\xE1vel", "Internacional", "Multimercado", "Caixa"];
    let passesFilter = true;
    if (settings.email.sendOnCriticalOnly) {
      if (alert.severity !== "CRITICAL") passesFilter = false;
    } else {
      if (!severitiesFilter.includes(alert.severity)) passesFilter = false;
      if (!assetClassesFilter.includes(alert.assetClass)) passesFilter = false;
      if (passesFilter) {
        const tolerance = settings.email.assetTolerances?.[alert.assetClass] ?? 0;
        if (tolerance > 0 && Math.abs(alert.deviationPP) <= tolerance) {
          passesFilter = false;
        }
      }
    }
    if (settings.email.enabled && passesFilter) {
      const maskedDest = maskEmail(settings.email.recipient);
      let subject = `[FlowCore URGENTE] ${alert.portfolioName} - Desenquadramento em ${alert.assetClass}`;
      if (settings.email.customSubjectTemplate) {
        subject = settings.email.customSubjectTemplate.replace(/\{\{portfolioName\}\}/g, alert.portfolioName).replace(/\{\{severity\}\}/g, alert.severity).replace(/\{\{assetClass\}\}/g, alert.assetClass);
      }
      let body = `Alerta Cr\xEDtico: ${alert.message}. Aloca\xE7\xE3o atual: ${alert.currentPercent.toFixed(1)}% (Teto ${alert.maxPercent.toFixed(1)}%). Excesso financeiro apurado: R$ ${alert.excessValueBRL.toLocaleString("pt-BR")}. Recomenda\xE7\xE3o: ${alert.suggestedAction}.`;
      if (settings.email.customBodyTemplate) {
        body = settings.email.customBodyTemplate.replace(/\{\{portfolioName\}\}/g, alert.portfolioName).replace(/\{\{severity\}\}/g, alert.severity).replace(/\{\{assetClass\}\}/g, alert.assetClass).replace(/\{\{message\}\}/g, alert.message).replace(/\{\{currentPercent\}\}/g, alert.currentPercent.toFixed(1)).replace(/\{\{maxPercent\}\}/g, alert.maxPercent.toFixed(1)).replace(/\{\{excessValueBRL\}\}/g, alert.excessValueBRL.toLocaleString("pt-BR"));
      }
      const emailLog = {
        id: `disp-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: "EMAIL",
        recipient: maskedDest,
        status: "SENT",
        subjectOrTitle: subject,
        bodyPreview: body,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity
      };
      dispatchLogs.unshift(emailLog);
      newLogs.push(emailLog);
    }
    if (settings.sms.enabled && (!settings.sms.sendOnCriticalOnly || alert.severity === "CRITICAL")) {
      const maskedPhone = maskPhoneNumber(settings.sms.phoneNumber);
      const smsLog = {
        id: `disp-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: "SMS",
        recipient: maskedPhone,
        status: "SENT",
        subjectOrTitle: `FlowCore SMS: ${alert.portfolioName}`,
        bodyPreview: `URGENTE: ${alert.portfolioName} violou teto de ${alert.assetClass} (${alert.currentPercent.toFixed(
          1
        )}% vs max ${alert.maxPercent.toFixed(1)}%). Excesso R$ ${alert.excessValueBRL.toLocaleString("pt-BR")}.`,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity
      };
      dispatchLogs.unshift(smsLog);
      newLogs.push(smsLog);
    }
  }
  if (dispatchLogs.length > 50) {
    dispatchLogs = dispatchLogs.slice(0, 50);
  }
  return newLogs;
}
function dispatchTestSecondaryAlertRepo(channel, testRecipient) {
  const settings = currentSettings;
  const dispatched = [];
  const timeFormatted = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  if (channel === "EMAIL" || channel === "ALL") {
    const rawEmail = testRecipient || settings.email.recipient;
    const maskedTarget = maskEmail(rawEmail);
    const log = {
      id: `disp-test-email-${Date.now()}`,
      channel: "EMAIL",
      recipient: maskedTarget,
      status: "SENT",
      subjectOrTitle: "[TESTE FlowCore] Verifica\xE7\xE3o de Canal Secund\xE1rio de E-mail de Compliance",
      bodyPreview: `Teste de canal secund\xE1rio para o gestor de conformidade. Monitoramento Sentinel CVM 175 conectado com sucesso. Destinat\xE1rio: ${maskedTarget}. Relat\xF3rios em anexo: ${settings.email.includeReportAttachment ? "Habilitado" : "Desabilitado"}.`,
      sentAt: timeFormatted,
      portfolioName: "Carteira de Teste Sentinel",
      severity: "CRITICAL"
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }
  if (channel === "SMS" || channel === "ALL") {
    const rawSms = testRecipient || settings.sms.phoneNumber;
    const maskedTargetSms = maskPhoneNumber(rawSms);
    const log = {
      id: `disp-test-sms-${Date.now()}`,
      channel: "SMS",
      recipient: maskedTargetSms,
      status: "SENT",
      subjectOrTitle: "FlowCore SMS TESTE",
      bodyPreview: `[FlowCore TESTE] Canal SMS verificado com sucesso para ${maskedTargetSms}. Alertas cr\xEDticos de desenquadramento ser\xE3o entregues em tempo real.`,
      sentAt: timeFormatted,
      portfolioName: "Carteira de Teste Sentinel",
      severity: "CRITICAL"
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }
  return {
    success: true,
    dispatched,
    message: `Notifica\xE7\xE3o de teste despachada com sucesso para os canais selecionados (${channel}).`
  };
}
function dispatchScheduledSummaryReportRepo(alerts, officeId, force = false) {
  const targetOfficeId = officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  const settings = getNotificationSettingsRepo({ unmasked: true, officeId: targetOfficeId });
  if (!settings.email.enabled) {
    return {
      success: false,
      dispatched: null,
      message: "Canal de e-mail est\xE1 desabilitado nas configura\xE7\xF5es deste escrit\xF3rio."
    };
  }
  if (!settings.email.scheduledReportEnabled && !force) {
    return {
      success: false,
      dispatched: null,
      message: "Envio de relat\xF3rio peri\xF3dico agendado est\xE1 desativado."
    };
  }
  const timeFormatted = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const dateFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const criticals = alerts.filter((a) => a.severity === "CRITICAL");
  const warnings = alerts.filter((a) => a.severity === "WARNING");
  const affectedPortfolios = [...new Set(alerts.map((a) => a.portfolioName))];
  const totalExcessBRL = alerts.reduce((acc, a) => acc + (a.excessValueBRL || 0), 0);
  const maskedTarget = maskEmail(settings.email.recipient);
  const bodyPreview = `[RELAT\xD3RIO DI\xC1RIO DE CONFORMIDADE - ${dateFormatted} \xE0s ${settings.email.scheduledReportTime || "08:00"}]
Escrit\xF3rio: ${targetOfficeId} | Destinat\xE1rio: ${maskedTarget}
Resumo Geral:
- Alertas Cr\xEDticos: ${criticals.length}
- Alertas de Aten\xE7\xE3o: ${warnings.length}
- Carteiras com Apontamentos: ${affectedPortfolios.length} (${affectedPortfolios.slice(0, 3).join(", ")}${affectedPortfolios.length > 3 ? "..." : ""})
- Volume Total em Desenquadramento: R$ ${totalExcessBRL.toLocaleString("pt-BR")}
- Anexo CSV Detalhado: ${settings.email.includeReportAttachment ? "Inclu\xEDdo (sum\xE1rio audit\xE1vel UTF-8)" : "N\xE3o solicitado"}.
Todos os dados foram extra\xEDdos do motor fiduci\xE1rio Sentinel CVM 175.`;
  const log = {
    id: `disp-scheduled-email-${Date.now()}`,
    channel: "EMAIL",
    recipient: maskedTarget,
    status: "SENT",
    subjectOrTitle: `[FlowCore Relat\xF3rio Di\xE1rio] Resumo de Conformidade CVM 175 (${dateFormatted})`,
    bodyPreview,
    sentAt: timeFormatted,
    portfolioName: affectedPortfolios.length > 0 ? affectedPortfolios.join(", ") : "Geral (Conforme)",
    severity: criticals.length > 0 ? "CRITICAL" : warnings.length > 0 ? "WARNING" : void 0,
    reportType: "SCHEDULED_SUMMARY"
  };
  dispatchLogs.unshift(log);
  if (dispatchLogs.length > 50) {
    dispatchLogs = dispatchLogs.slice(0, 50);
  }
  return {
    success: true,
    dispatched: log,
    message: `Relat\xF3rio de conformidade agendado gerado e enviado com sucesso para ${maskedTarget}.`
  };
}

// src/server/complianceAgent.ts
var ComplianceAgent = class {
  /**
   * Calcula a distribuição atual de ativos por classe para a carteira especificada.
   */
  static calculateAllocations(portfolio) {
    const totalValue = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    const safeTotal = totalValue > 0 ? totalValue : portfolio.totalAum;
    const classTotals = {
      "Renda Fixa": 0,
      "Renda Vari\xE1vel": 0,
      "Internacional": 0,
      "Multimercado": 0,
      "Caixa": 0
    };
    for (const asset of portfolio.assets) {
      if (classTotals[asset.assetClass] !== void 0) {
        classTotals[asset.assetClass] += asset.totalValue;
      }
    }
    const summaries = [];
    for (const limit of portfolio.mandateLimits) {
      const currentVal = classTotals[limit.assetClass] || 0;
      const currentPct = safeTotal > 0 ? currentVal / safeTotal * 100 : 0;
      const roundedCurrentPct = Math.round(currentPct * 100) / 100;
      const criticalTolerance = limit.criticalTolerancePP ?? limit.tolerancePP ?? 5;
      const warningTolerance = limit.warningTolerancePP ?? 0;
      let severity = "NORMAL";
      let deviationPP = 0;
      if (limit.criticalTriggerPercent !== void 0 && roundedCurrentPct >= limit.criticalTriggerPercent) {
        severity = "CRITICAL";
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
      } else if (limit.warningTriggerPercent !== void 0 && roundedCurrentPct >= limit.warningTriggerPercent) {
        severity = "WARNING";
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
      } else if (roundedCurrentPct > limit.maxPercent) {
        deviationPP = Math.round((roundedCurrentPct - limit.maxPercent) * 100) / 100;
        if (deviationPP > criticalTolerance) {
          severity = "CRITICAL";
        } else {
          severity = "WARNING";
        }
      } else if (roundedCurrentPct < limit.minPercent) {
        const underDeviation = Math.round((limit.minPercent - roundedCurrentPct) * 100) / 100;
        deviationPP = -underDeviation;
        if (underDeviation > criticalTolerance) {
          severity = "CRITICAL";
        } else {
          severity = "WARNING";
        }
      } else if (warningTolerance > 0 && roundedCurrentPct >= limit.maxPercent - warningTolerance) {
        severity = "WARNING";
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
        ruleSource: limit.ruleSource || "MANDATO_CLIENTE",
        policyId: limit.policyId || portfolio.assignedPolicyId || "IPS-DEFAULT",
        tolerancePP: criticalTolerance
      });
    }
    return summaries;
  }
  /**
   * Avalia a carteira e gera alertas detalhados de compliance com rigor técnico e separação estrita de fontes normativas.
   */
  static evaluatePortfolio(portfolio) {
    const allocations = this.calculateAllocations(portfolio);
    const alerts = [];
    const totalVal = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    for (const alloc of allocations) {
      if (alloc.severity === "NORMAL") continue;
      const isOver = alloc.deviationPP > 0;
      const absDeviation = Math.abs(alloc.deviationPP);
      const ruleSource = alloc.ruleSource || "MANDATO_CLIENTE";
      const policyId = alloc.policyId || "IPS-DEFAULT";
      const tolerance = alloc.tolerancePP || 5;
      const deviationBRL = absDeviation / 100 * totalVal;
      const targetDiffPct = Math.abs(alloc.currentPercent - alloc.targetPercent);
      const targetTradeValue = targetDiffPct / 100 * totalVal;
      let sourceDescriptor = "";
      let governanceNote = "";
      let mandateVsInternalExplanation = "";
      switch (ruleSource) {
        case "MANDATO_CLIENTE":
          sourceDescriptor = `Mandato do Cliente (IPS - ${policyId})`;
          governanceNote = `Viola\xE7\xE3o direta do Investment Policy Statement (IPS) celebrado formalmente com o cliente investidor.`;
          mandateVsInternalExplanation = `Diferen\xE7a Fiduci\xE1ria: O Mandato do Cliente (IPS) \xE9 um contrato bilateral legalmente vinculante entre o investidor e a gestora. Um desenquadramento de mandato constitui potencial quebra do dever fiduci\xE1rio contratual perante o titular, exigindo rebalanceamento compuls\xF3rio priorit\xE1rio ou termo formal de alinhamento com o cliente. Diferente da Pol\xEDtica Interna da gestora (que \xE9 uma diretriz de governan\xE7a corporativa da casa), o Mandato vincula os direitos exclusivos e o perfil patrimonial contratado do cliente.`;
          break;
        case "POLITICA_INTERNA":
          sourceDescriptor = `Pol\xEDtica Interna da Gestora (${policyId})`;
          governanceNote = `Desvio em rela\xE7\xE3o \xE0s diretrizes prudenciais do Comit\xEA de Aloca\xE7\xE3o e Risco interno da casa.`;
          mandateVsInternalExplanation = `Diferen\xE7a Fiduci\xE1ria: A Pol\xEDtica Interna \xE9 um par\xE2metro prudencial de governan\xE7a e controle de risco estabelecido pela pr\xF3pria gestora para mitigar riscos sist\xEAmicos, liquidez e limites de concentra\xE7\xE3o global. O desenquadramento n\xE3o constitui necessariamente quebra direta de contrato com o cliente, mas sim uma inconformidade de governan\xE7a corporativa que aciona o Comit\xEA de Risco para delibera\xE7\xE3o de conting\xEAncia ou enquadramento planejado.`;
          break;
        case "REGRA_REGULATORIA":
          sourceDescriptor = `Regra Regulat\xF3ria CVM/CMN (${policyId})`;
          governanceNote = `Viola\xE7\xE3o formal de limite regulat\xF3rio externo (Resolu\xE7\xE3o CVM 175). Sujeito a notifica\xE7\xE3o e prazo improrrog\xE1vel de reenquadramento sob supervis\xE3o de cust\xF3dia.`;
          mandateVsInternalExplanation = `Diferen\xE7a Fiduci\xE1ria: Regra legal imperativa estipulada pelo regulador de mercado (CVM/CMN). Prevalece hierarquicamente sobre o Mandato do Cliente e sobre as Pol\xEDticas Internas da gestora, com prazos perempt\xF3rios de reenquadramento fixados pela regulamenta\xE7\xE3o.`;
          break;
        case "SUITABILITY":
          sourceDescriptor = `Suitability / Perfil do Cliente (${policyId})`;
          governanceNote = `Risco de desenquadramento de perfil de investidor (API / Resolu\xE7\xE3o CVM 30). Requer reavalia\xE7\xE3o cadastral ou rebalanceamento preventivo.`;
          mandateVsInternalExplanation = `Diferen\xE7a Fiduci\xE1ria: Regra de adequa\xE7\xE3o de perfil ao investidor (CVM 30 e C\xF3digo ANBIMA). Limita a exposi\xE7\xE3o m\xE1xima de risco permitida para a categoria do investidor perante o regulador e o mandato.`;
          break;
        default:
          sourceDescriptor = `Mandato de Investimento do Cliente (${policyId})`;
          governanceNote = `Desvio bilateral em rela\xE7\xE3o ao contrato/IPS celebrado com o cliente.`;
          mandateVsInternalExplanation = `Diferen\xE7a Fiduci\xE1ria: O Mandato do Cliente vincula contratualmente a rela\xE7\xE3o fiduci\xE1ria entre o investidor e o gestor.`;
          break;
      }
      let message = "";
      let suggestedAction = "";
      if (isOver) {
        if (alloc.severity === "CRITICAL") {
          message = `[${alloc.severity}] Desenquadramento em ${alloc.assetClass}: aloca\xE7\xE3o atingiu ${alloc.currentPercent.toFixed(1)}% vs limite m\xE1ximo de ${alloc.maxPercent.toFixed(1)}% (+${absDeviation.toFixed(1)} p.p. acima do teto; toler\xE2ncia configurada: ${tolerance.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Venda disciplinada de aprox. R$ ${deviationBRL.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} em ${alloc.assetClass} para restaurar o teto, ou R$ ${targetTradeValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} para trazer ao target de ${alloc.targetPercent}%. Alocar o produto em Caixa/Renda Fixa.`;
        } else {
          message = `[${alloc.severity}] Alerta de toler\xE2ncia em ${alloc.assetClass}: aloca\xE7\xE3o em ${alloc.currentPercent.toFixed(1)}% superou o limite de ${alloc.maxPercent.toFixed(1)}% em +${absDeviation.toFixed(1)} p.p., dentro da faixa de toler\xE2ncia de ${tolerance.toFixed(1)} p.p. Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Programar redu\xE7\xE3o compensat\xF3ria de R$ ${deviationBRL.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ou direcionar novas contribui\xE7\xF5es a classes subalocadas.`;
        }
      } else {
        if (alloc.severity === "CRITICAL") {
          message = `[${alloc.severity}] Subaloca\xE7\xE3o cr\xEDtica em ${alloc.assetClass}: aloca\xE7\xE3o em ${alloc.currentPercent.toFixed(1)}% est\xE1 abaixo do piso obrigat\xF3rio de ${alloc.minPercent.toFixed(1)}% (-${absDeviation.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Aporte ou compra planejada de aprox. R$ ${deviationBRL.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} em ${alloc.assetClass} para retornar ao patamar m\xEDnimo.`;
        } else {
          message = `[${alloc.severity}] Alerta de piso em ${alloc.assetClass}: aloca\xE7\xE3o em ${alloc.currentPercent.toFixed(1)}% est\xE1 ligeiramente abaixo do piso de ${alloc.minPercent.toFixed(1)}% (-${absDeviation.toFixed(1)} p.p.). Fonte: ${sourceDescriptor}.`;
          suggestedAction = `Priorizar aloca\xE7\xE3o de proventos ou caixa ocioso em ativos desta classe.`;
        }
      }
      const classAssets = portfolio.assets.filter((a) => a.assetClass === alloc.assetClass);
      let marketContextExplanation = "";
      let bestPerformingAsset = null;
      let worstPerformingAsset = null;
      for (const asset of classAssets) {
        if (asset.historicalPerformance) {
          if (!bestPerformingAsset || (asset.historicalPerformance.twelveMonths || 0) > (bestPerformingAsset.historicalPerformance?.twelveMonths || 0)) {
            bestPerformingAsset = asset;
          }
          if (!worstPerformingAsset || (asset.historicalPerformance.twelveMonths || 0) < (worstPerformingAsset.historicalPerformance?.twelveMonths || 0)) {
            worstPerformingAsset = asset;
          }
        }
      }
      let whyExplanation = "Varia\xE7\xE3o de mercado e rendimento acumulado dos ativos componentes aumentaram a participa\xE7\xE3o relativa da classe de forma desproporcional sem interven\xE7\xE3o recente de caixa.";
      if (isOver && bestPerformingAsset && bestPerformingAsset.historicalPerformance?.twelveMonths) {
        const perf = bestPerformingAsset.historicalPerformance.twelveMonths;
        if (perf > 5) {
          marketContextExplanation = `O ativo ${bestPerformingAsset.ticker} valorizou ${perf.toFixed(1)}% nos \xFAltimos 12 meses, causando grande parte dos ${absDeviation.toFixed(1)} p.p. de desvio por varia\xE7\xE3o de mercado (desenquadramento passivo), sem necessidade de opera\xE7\xE3o manual recente.`;
          whyExplanation = `A valoriza\xE7\xE3o expressiva de ativos da carteira (ex: ${bestPerformingAsset.ticker} subiu ${perf.toFixed(1)}% em 12 meses) distorceu a aloca\xE7\xE3o relativa para al\xE9m do limite permitido.`;
        }
      } else if (!isOver && worstPerformingAsset && worstPerformingAsset.historicalPerformance?.twelveMonths !== void 0) {
        const perf = worstPerformingAsset.historicalPerformance.twelveMonths;
        if (perf < -5) {
          marketContextExplanation = `O ativo ${worstPerformingAsset.ticker} desvalorizou ${Math.abs(perf).toFixed(1)}% nos \xFAltimos 12 meses, causando grande parte dos -${absDeviation.toFixed(1)} p.p. de desvio por contra\xE7\xE3o de mercado (desenquadramento passivo), sem necessidade de resgate manual recente.`;
          whyExplanation = `A desvaloriza\xE7\xE3o de ativos da classe (ex: ${worstPerformingAsset.ticker} caiu ${Math.abs(perf).toFixed(1)}% em 12 meses) reduziu a participa\xE7\xE3o relativa para abaixo do piso obrigat\xF3rio.`;
        }
      }
      const aiExplanation = {
        what: `A exposi\xE7\xE3o em ${alloc.assetClass} atingiu ${alloc.currentPercent.toFixed(1)}% do patrim\xF4nio l\xEDquido, ultrapassando a marca estipulada de ${isOver ? alloc.maxPercent.toFixed(1) : alloc.minPercent.toFixed(1)}% em ${absDeviation.toFixed(1)} p.p.`,
        why: whyExplanation,
        impact: `${governanceNote} Risco estimado de volatilidade adicional e impacto no tracking error em rela\xE7\xE3o ao benchmark ${portfolio.benchmark}.`,
        action: suggestedAction,
        confidence: alloc.severity === "CRITICAL" ? 97 : 91,
        source: `${sourceDescriptor} \u2022 Vig\xEAncia: 2026`
      };
      alerts.push({
        id: `alt-${portfolio.id}-${alloc.assetClass.toLowerCase().replace(/[\s/]/g, "-")}`,
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
        timestamp: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
        ruleSource,
        policyId,
        limit: isOver ? alloc.maxPercent : alloc.minPercent,
        currentValue: alloc.currentPercent,
        rule_source: ruleSource,
        policy_id: policyId,
        current_value: alloc.currentPercent,
        difference: alloc.deviationPP,
        effectiveDate: "01/01/2026",
        tolerancePP: tolerance,
        mandateVsInternalExplanation,
        marketContextExplanation,
        aiExplanation
      });
    }
    return alerts;
  }
  /**
   * Avalia todas as carteiras e retorna a lista consolidada de alertas de compliance.
   * Atende diretamente ao endpoint GET /api/alerts.
   */
  static evaluateAllPortfolios(portfolios) {
    const allAlerts = [];
    for (const portfolio of portfolios) {
      const alerts = this.evaluatePortfolio(portfolio);
      allAlerts.push(...alerts);
    }
    return allAlerts.sort((a, b) => {
      if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
      if (a.severity !== "CRITICAL" && b.severity === "CRITICAL") return 1;
      return Math.abs(b.deviationPP) - Math.abs(a.deviationPP);
    });
  }
  /**
   * Determina o status consolidado de uma carteira (CRITICAL se houver qualquer alerta crítico, WARNING se houver aviso, senão NORMAL).
   */
  static getPortfolioOverallSeverity(portfolio) {
    const alerts = this.evaluatePortfolio(portfolio);
    if (alerts.some((a) => a.severity === "CRITICAL")) return "CRITICAL";
    if (alerts.some((a) => a.severity === "WARNING")) return "WARNING";
    return "NORMAL";
  }
  /**
   * Gera uma proposta detalhada de ordens de rebalanceamento (boletas) para reenquadrar a carteira ao target ou limite aceitável.
   */
  static generateRebalancePlan(portfolio) {
    const allocations = this.calculateAllocations(portfolio);
    const totalVal = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    const orders = [];
    const overAllocated = allocations.filter((a) => a.deviationPP > 0);
    const underAllocated = allocations.filter((a) => a.currentPercent < a.targetPercent);
    let totalFreedCash = 0;
    for (const over of overAllocated) {
      const excessPct = over.currentPercent - over.targetPercent;
      const excessBRL = excessPct / 100 * totalVal;
      let remainingToSell = excessBRL;
      const classAssets = portfolio.assets.filter((a) => a.assetClass === over.assetClass).sort((a, b) => b.totalValue - a.totalValue);
      for (const asset of classAssets) {
        if (remainingToSell <= 0) break;
        const sellAmount = Math.min(remainingToSell, asset.totalValue * 0.4);
        const qtyToSell = Math.floor(sellAmount / asset.currentPrice);
        if (qtyToSell > 0) {
          const tradeBRL = qtyToSell * asset.currentPrice;
          remainingToSell -= tradeBRL;
          totalFreedCash += tradeBRL;
          orders.push({
            assetId: asset.id,
            ticker: asset.ticker,
            assetClass: asset.assetClass,
            action: "SELL",
            quantity: qtyToSell,
            unitPrice: asset.currentPrice,
            totalAmountBRL: Math.round(tradeBRL),
            reason: `Venda para redu\xE7\xE3o da classe ${over.assetClass} (${over.currentPercent.toFixed(1)}% -> meta ${over.targetPercent.toFixed(1)}%)`
          });
        }
      }
    }
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
              action: "BUY",
              quantity: qtyToBuy,
              unitPrice: targetAsset.currentPrice,
              totalAmountBRL: Math.round(qtyToBuy * targetAsset.currentPrice),
              reason: `Aporte compensat\xF3rio para elevar ${under.assetClass} em dire\xE7\xE3o \xE0 meta de ${under.targetPercent}%`
            });
          }
        }
      }
    }
    return orders;
  }
};

// src/server/geminiService.ts
var import_genai = require("@google/genai");
var aiClient = null;
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function askComplianceAgent(userQuery, portfolios, alerts) {
  const ai = getAiClient();
  const portfolioSummary = portfolios.map((p) => {
    const pAlerts = alerts.filter((a) => a.portfolioId === p.id);
    const allocations = ComplianceAgent.calculateAllocations(p);
    return {
      id: p.id,
      name: p.name,
      client: p.clientName,
      profile: p.profile,
      aum: `R$ ${(p.totalAum / 1e6).toFixed(2)}M`,
      status: p.status,
      alerts: pAlerts.map((a) => `${a.severity}: ${a.assetClass} (${a.currentPercent}% vs teto ${a.maxPercent}%)`),
      allocations: allocations.map((al) => `${al.assetClass}: ${al.currentPercent}% (meta ${al.targetPercent}%, m\xE1x ${al.maxPercent}%)`)
    };
  });
  const prompt = `Voc\xEA \xE9 o ComplianceAgent do FlowCore, um consultor s\xEAnior de compliance regulat\xF3rio e estrategista de mercado financeiro, especializado em fundos de investimento, Family Offices e Asset Management. Voc\xEA possui dom\xEDnio profundo das regula\xE7\xF5es da CVM (em especial a Resolu\xE7\xE3o CVM 175), diretrizes de marca\xE7\xE3o a mercado da Anbima, regras tribut\xE1rias para fundos de investimento e din\xE2mica avan\xE7ada de macroeconomia, pol\xEDtica monet\xE1ria e classes de ativos (Renda Fixa, Equities, FIPs, FIIs, Derivativos e Ativos no Exterior).

Contexto atual das carteiras monitoradas no sistema:
${JSON.stringify(portfolioSummary, null, 2)}

Regras de Classifica\xE7\xE3o Vigentes no Motor de Risco (FlowCore):
- \u{1F7E2} NORMAL: Dentro do limite estipulado na pol\xEDtica de investimentos/mandato.
- \u{1F7E1} ATEN\xC7\xC3O / WARNING: Acima do limite estipulado em at\xE9 5 p.p. (faixa de monitoramento preventivo).
- \u{1F534} DESENQUADRADO / CRITICAL: Excesso superior a 5 p.p. acima do limite teto (desenquadramento passivo ou ativo, exigindo notifica\xE7\xE3o ao administrador fiduci\xE1rio e plano de rebalanceamento).

Pergunta do Usu\xE1rio (Gestor, Assessor ou Compliance Officer):
"${userQuery}"

Por favor, responda de forma t\xE9cnica, executiva, precisa e altamente estruturada. Como especialista do mercado financeiro, aplique seu conhecimento regulat\xF3rio e de mercado na resposta, seguindo estas diretrizes:
1. Diagn\xF3stico Regulat\xF3rio e de Mercado: Avalie a situa\xE7\xE3o da carteira citada, correlacionando o desvio com movimentos normais de mercado (ex: fechamento de curva de juros, rali de bolsa) ou quebra de mandato ativa.
2. Vi\xE9s Fiduci\xE1rio e CVM 175: Pontue os prazos regulat\xF3rios normais (ex: 15 dias \xFAteis para reenquadramento de desenquadramento passivo, conforme regras t\xEDpicas da CVM) e as responsabilidades do gestor frente ao administrador.
3. Plano de Rebalanceamento Estrat\xE9gico: Sugira a\xE7\xF5es de reenquadramento, indicando quais classes de ativos comprar ou vender e o volume financeiro estimado, considerando liquidez e mitiga\xE7\xE3o de custos de transa\xE7\xE3o.
4. Impacto Tribut\xE1rio e Operacional: Fa\xE7a considera\xE7\xF5es executivas sobre potenciais impactos de come-cotas (se aplic\xE1vel ao perfil), spread de mercado ou impactos de liquida\xE7\xE3o que o gestor deve ponderar ao executar a boleta.`;
  if (!ai) {
    return generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt
    });
    return response.text || generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  } catch (error) {
    console.error("Error in Gemini API call, using fallback:", error);
    return generateFallbackComplianceResponse(userQuery, portfolios, alerts);
  }
}
function generateFallbackComplianceResponse(query, portfolios, alerts) {
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;
  const criticalPortfolios = portfolios.filter((p) => p.status === "CRITICAL");
  const qLower = query.toLowerCase();
  if (qLower.includes("justificativa") || qLower.includes("parecer") || qLower.includes("minuta")) {
    const port = criticalPortfolios[0] || portfolios[0];
    return `### \u{1F4C4} Parecer T\xE9cnico de Compliance - FlowCore

**Ref:** Notifica\xE7\xE3o de Desenquadramento e Plano de Regulariza\xE7\xE3o
**Carteira:** ${port.name} (${port.code})
**Titular:** ${port.clientName} | **Gestor Respons\xE1vel:** ${port.manager}
**Data de Emiss\xE3o:** ${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}

#### 1. Constata\xE7\xE3o do Desenquadramento
Identificou-se pelo motor automatizado do FlowCore que a carteira superou a banda de toler\xE2ncia estipulada no mandato (${port.profile}). Conforme os par\xE2metros operacionais, desvios superiores a **5.0 p.p.** caracterizam **\u{1F534} DESENQUADRADO / CRITICAL**.

#### 2. Causa Raiz
O movimento at\xEDpico decorreu da forte valoriza\xE7\xE3o relativa dos ativos da referida classe no per\xEDodo recente aliada \xE0 volatilidade de mercado, expandindo a representatividade percentual acima do teto regulat\xF3rio.

#### 3. Plano de Reenquadramento Recomendado
- **Execu\xE7\xE3o de Desinvestimento:** Realizar aliena\xE7\xE3o programada no valor estimado de recomposi\xE7\xE3o para reconduzir a aloca\xE7\xE3o \xE0 meta (Target).
- **Destina\xE7\xE3o de Recursos:** Realoca\xE7\xE3o em t\xEDtulos de alta liquidez e baixo risco de mercado (ex: Tesouro Selic / CDB DI).
- **Prazo Limite CVM:** Prazo padr\xE3o de at\xE9 15 dias \xFAteis para encerramento do desenquadramento passivo.

*Parecer emitido automaticamente pelo motor ComplianceAgent do FlowCore.*`;
  }
  return `### \u{1F6E1}\uFE0F Diagn\xF3stico de Conformidade do FlowCore

Atualmente temos **${portfolios.length} carteiras monitoradas**, com um total de **${alerts.length} alertas ativos**:
- \u{1F534} **${criticalCount} Desenquadramentos Cr\xEDticos** (excesso > 5 p.p. sobre o limite da pol\xEDtica);
- \u{1F7E1} **${warningCount} Alertas em Aten\xE7\xE3o** (excesso de at\xE9 5 p.p., em banda de monitoramento preventivo);
- \u{1F7E2} **${portfolios.filter((p) => p.status === "NORMAL").length} Carteiras em Conformidade Total**.

#### Principais Pontos de Aten\xE7\xE3o Imediata:
` + criticalPortfolios.map((p) => {
    const pAlert = alerts.find((a) => a.portfolioId === p.id && a.severity === "CRITICAL");
    return `\u2022 **${p.name}** (${p.clientName}): Excesso em **${pAlert?.assetClass || "Ativos"}** (${pAlert?.currentPercent.toFixed(1)}% vs teto de ${pAlert?.maxPercent.toFixed(1)}%, desvio de **+${pAlert?.deviationPP.toFixed(1)} p.p.**). Sugest\xE3o: ${pAlert?.suggestedAction}`;
  }).join("\n") + `

*Utilize a aba do **Simulador de Rebalanceamento** para gerar as boletas e formalizar a execu\xE7\xE3o das ordens de reenquadramento.*`;
}

// server.ts
var import_cors = __toESM(require("cors"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
app.use((0, import_cors.default)({
  origin: "*",
  // Permitir de qualquer origem (inclusive app Capacitor localhost)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
var VALID_API_TOKENS = /* @__PURE__ */ new Set();
if (process.env.API_TOKEN) {
  VALID_API_TOKENS.add(process.env.API_TOKEN.trim());
}
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.trim().split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      const token = parts[1].trim();
      if (VALID_API_TOKENS.has(token)) {
        return next();
      }
      return res.status(401).json({
        success: false,
        error: "Acesso n\xE3o autorizado: Token de API incorreto.",
        code: "INVALID_TOKEN"
      });
    }
  }
  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && VALID_API_TOKENS.has(apiKeyHeader.trim())) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: "Acesso n\xE3o autorizado: Autentica\xE7\xE3o Bearer obrigat\xF3ria.",
    code: "AUTH_REQUIRED"
  });
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FlowCore Sentinel Engine",
    timestamp: Date.now(),
    uptime: Math.round(process.uptime()),
    version: "2.4.0",
    mode: "LIVE"
  });
});
app.get("/api/policies", (req, res) => {
  try {
    const policies = getPoliciesRepo();
    res.json({ success: true, count: policies.length, policies });
  } catch (error) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ success: false, error: "Falha ao buscar pol\xEDticas normativas" });
  }
});
app.get("/api/policies/:id", (req, res) => {
  try {
    const policy = getPolicyByIdRepo(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, error: "Pol\xEDtica n\xE3o encontrada" });
    }
    res.json({ success: true, policy });
  } catch (error) {
    console.error("Error fetching policy:", error);
    res.status(500).json({ success: false, error: "Falha ao buscar pol\xEDtica" });
  }
});
app.get("/api/telemetry", (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
    const warningCount = alerts.filter((a) => a.severity === "WARNING").length;
    res.json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      orchestrator: {
        status: "ACTIVE_ONLINE",
        mode: "SUPERVISED_AUTONOMOUS",
        lastHeartbeat: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR"),
        latencyMs: 38
      },
      agents: [
        {
          id: "agent-compliance-guard",
          name: "Compliance Guard Sentinel",
          status: "MONITORING",
          monitoredRules: ["CVM 175", "CMN 4.963", "IPS Mandatos", "Suitability CVM 30"],
          activeBreaches: criticalCount,
          warnings: warningCount,
          lastScan: "Agora"
        },
        {
          id: "agent-rebalance-engine",
          name: "Rebalance Allocation Planner",
          status: "IDLE_WAITING_APPROVAL",
          pendingProposals: criticalCount + warningCount,
          mode: "SIMULATION_ONLY",
          directExecutionAllowed: false
        },
        {
          id: "agent-risk-monitor",
          name: "Portfolio Risk Assessor",
          status: "OPTIMAL",
          portfoliosTracked: portfolios.length,
          aggregateAum: portfolios.reduce((s, p) => s + p.totalAum, 0)
        }
      ]
    });
  } catch (error) {
    console.error("Error fetching telemetry:", error);
    res.status(500).json({ success: false, error: "Falha na telemetria dos agentes" });
  }
});
app.get("/api/alerts", (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    res.json({
      success: true,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length,
      alerts
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, error: "Falha ao calcular alertas de compliance" });
  }
});
app.get("/api/limits/config", (req, res) => {
  try {
    const portfolioId = req.query.portfolioId;
    const configs = getLimitsConfigRepo(portfolioId);
    res.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error("Error fetching limits config:", error);
    res.status(500).json({ success: false, error: "Falha ao buscar par\xE2metros de limites" });
  }
});
app.post("/api/limits/config", (req, res) => {
  try {
    const { configs, portfolioId } = req.body;
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, error: "Array de configura\xE7\xF5es \xE9 obrigat\xF3rio" });
    }
    const updatedPortfolios = updateLimitsConfigRepo(configs, portfolioId);
    for (const port of updatedPortfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(updatedPortfolios);
    res.json({
      success: true,
      message: "Limites e sensibilidade de compliance atualizados com sucesso.",
      portfolios: updatedPortfolios,
      alerts,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length
    });
  } catch (error) {
    console.error("Error updating limits config:", error);
    res.status(500).json({ success: false, error: "Falha ao atualizar par\xE2metros de limites" });
  }
});
app.post("/api/limits/reset", (req, res) => {
  try {
    const configs = resetLimitsConfigRepo();
    const updatedPortfolios = updateLimitsConfigRepo(configs);
    for (const port of updatedPortfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(updatedPortfolios);
    res.json({
      success: true,
      message: "Par\xE2metros de limites restaurados para os padr\xF5es regulat\xF3rios.",
      configs,
      portfolios: updatedPortfolios,
      alerts
    });
  } catch (error) {
    console.error("Error resetting limits config:", error);
    res.status(500).json({ success: false, error: "Falha ao restaurar par\xE2metros de limites" });
  }
});
app.get("/api/portfolios", (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    res.json({ success: true, portfolios });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    res.status(500).json({ success: false, error: "Falha ao buscar carteiras" });
  }
});
app.get("/api/portfolios/:id", (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: "Carteira n\xE3o encontrada" });
    }
    portfolio.status = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    const allocations = ComplianceAgent.calculateAllocations(portfolio);
    const alerts = ComplianceAgent.evaluatePortfolio(portfolio);
    res.json({
      success: true,
      portfolio,
      allocations,
      alerts
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ success: false, error: "Falha ao carregar carteira" });
  }
});
app.get("/api/portfolios/:id/rebalance-plan", (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: "Carteira n\xE3o encontrada" });
    }
    const plan = ComplianceAgent.generateRebalancePlan(portfolio);
    res.json({ success: true, orders: plan });
  } catch (error) {
    console.error("Error generating rebalance plan:", error);
    res.status(500).json({ success: false, error: "Falha ao planejar rebalanceamento" });
  }
});
app.post("/api/portfolios/:id/rebalance", (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: "Carteira n\xE3o encontrada" });
    }
    const previousSeverity = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    const orders = req.body.orders || ComplianceAgent.generateRebalancePlan(portfolio);
    let cashChange = 0;
    for (const order of orders) {
      const asset = portfolio.assets.find((a) => a.id === order.assetId);
      if (asset) {
        if (order.action === "SELL") {
          asset.quantity = Math.max(0, asset.quantity - order.quantity);
          asset.totalValue = asset.quantity * asset.currentPrice;
          cashChange += order.totalAmountBRL;
        } else if (order.action === "BUY") {
          asset.quantity += order.quantity;
          asset.totalValue = asset.quantity * asset.currentPrice;
          cashChange -= order.totalAmountBRL;
        }
      }
    }
    portfolio.cashBalance += cashChange;
    const newTotalAum = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    portfolio.totalAum = newTotalAum;
    for (const a of portfolio.assets) {
      a.allocationPercent = newTotalAum > 0 ? a.totalValue / newTotalAum * 100 : 0;
    }
    portfolio.lastRebalanced = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const newSeverity = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    portfolio.status = newSeverity;
    updatePortfolioRepo(portfolio);
    const auditProtocolId = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const approver = req.body.approvedBy || "Comit\xEA de Aloca\xE7\xE3o (Sess\xE3o Human-in-the-Loop)";
    const auditLog = `[AMBIENTE DE SIMULA\xC7\xC3O] Protocolo ${auditProtocolId} registrado em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}. Aprovador: ${approver}. Status de compliance: ${previousSeverity} -> ${newSeverity}. ${orders.length} ordens de rebalanceamento simuladas totalizando R$ ${orders.reduce((s, o) => s + o.totalAmountBRL, 0).toLocaleString("pt-BR")}. Nenhuma ordem roteada para corretoras externas/B3 (Modo Sandbox estrito).`;
    const result = {
      success: true,
      portfolioId: portfolio.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      previousSeverity,
      newSeverity,
      executedOrders: orders,
      auditLog,
      updatedPortfolio: portfolio,
      isSimulationOnly: true,
      auditProtocolId,
      approvedBy: approver
    };
    res.json(result);
  } catch (error) {
    console.error("Error executing rebalance:", error);
    res.status(500).json({ success: false, error: "Falha ao executar rebalanceamento" });
  }
});
app.post("/api/portfolios/reset", (req, res) => {
  try {
    const portfolios = resetPortfoliosRepo();
    res.json({ success: true, portfolios });
  } catch (error) {
    console.error("Error resetting portfolios:", error);
    res.status(500).json({ success: false, error: "Falha ao reiniciar dados" });
  }
});
app.post("/api/portfolios/simulate-shock", (req, res) => {
  try {
    const portfolioId = req.body.portfolioId;
    const shockResult = simulateMarketShockRepo(portfolioId);
    const portfolios = getPortfoliosRepo();
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const criticals = alerts.filter((a) => a.severity === "CRITICAL");
    const secondaryDispatches = dispatchSecondaryAlertsRepo(criticals);
    res.json({
      success: true,
      shock: shockResult,
      message: `Volatilidade aplicada no ativo ${shockResult.affectedAsset} (${shockResult.portfolio.name}). Novo desenquadramento gerado.`,
      portfolios,
      alerts,
      secondaryDispatches
    });
  } catch (error) {
    console.error("Error simulating market shock:", error);
    res.status(500).json({ success: false, error: "Falha ao simular choque de volatilidade" });
  }
});
app.get("/api/notifications/settings", (req, res) => {
  try {
    const officeId = req.query.office_id || req.query.officeId;
    const settings = getNotificationSettingsRepo({ officeId });
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error getting notification settings:", error);
    res.status(500).json({ success: false, error: "Falha ao obter configura\xE7\xF5es de notifica\xE7\xE3o" });
  }
});
app.post("/api/notifications/settings", (req, res) => {
  try {
    const officeId = req.body.office_id || req.body.officeId || req.query.office_id || req.query.officeId;
    const updated = updateNotificationSettingsRepo(req.body, officeId);
    res.json({ success: true, settings: updated, message: "Configura\xE7\xF5es de canais de notifica\xE7\xE3o atualizadas com sucesso" });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ success: false, error: "Falha ao salvar configura\xE7\xF5es de notifica\xE7\xE3o" });
  }
});
app.get("/api/notifications/dispatches", (req, res) => {
  try {
    const logs = getSecondaryDispatchLogsRepo();
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error getting notification logs:", error);
    res.status(500).json({ success: false, error: "Falha ao obter hist\xF3rico de despachos" });
  }
});
app.post("/api/notifications/dispatches/test", (req, res) => {
  try {
    const { channel, recipient } = req.body;
    const result = dispatchTestSecondaryAlertRepo(channel || "ALL", recipient);
    res.json(result);
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ success: false, error: "Falha ao enviar notifica\xE7\xE3o de teste" });
  }
});
app.post("/api/notifications/scheduled-report/trigger", (req, res) => {
  try {
    const { officeId, force } = req.body || {};
    const portfolios = getPortfoliosRepo();
    const realAlerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const result = dispatchScheduledSummaryReportRepo(realAlerts, officeId, force !== false);
    res.json(result);
  } catch (error) {
    console.error("Error triggering scheduled summary report:", error);
    res.status(500).json({ success: false, error: "Falha ao processar relat\xF3rio di\xE1rio agendado" });
  }
});
app.post("/api/notifications/dispatches/trigger", (req, res) => {
  try {
    const { alerts } = req.body;
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.json({ success: true, dispatched: [] });
    }
    const criticals = alerts.filter((a) => a.severity === "CRITICAL");
    const logs = dispatchSecondaryAlertsRepo(criticals);
    res.json({ success: true, dispatched: logs });
  } catch (error) {
    console.error("Error triggering secondary notifications:", error);
    res.status(500).json({ success: false, error: "Falha ao disparar canais secund\xE1rios" });
  }
});
app.post("/api/notifications/dispatches/clear", (req, res) => {
  try {
    clearSecondaryDispatchLogsRepo();
    res.json({ success: true, message: "Hist\xF3rico de despachos limpo com sucesso" });
  } catch (error) {
    console.error("Error clearing notification logs:", error);
    res.status(500).json({ success: false, error: "Falha ao limpar hist\xF3rico de despachos" });
  }
});
app.post("/api/compliance/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: "Pergunta obrigat\xF3ria" });
    }
    const portfolios = getPortfoliosRepo();
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const answer = await askComplianceAgent(query, portfolios, alerts);
    res.json({ success: true, answer });
  } catch (error) {
    console.error("Error in compliance chat:", error);
    res.status(500).json({ success: false, error: "Erro ao processar consulta de compliance" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (req.method === "GET" && !url.startsWith("/api") && req.headers.accept?.includes("text/html")) {
        try {
          const indexPath = import_path.default.join(process.cwd(), "index.html");
          let template = import_fs.default.readFileSync(indexPath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          return next(e);
        }
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = import_path.default.join(distPath, "index.html");
      let html = import_fs.default.readFileSync(indexPath, "utf-8");
      res.send(html);
    });
  }
  let lastDispatchedDateMinute = "";
  setInterval(() => {
    try {
      const now = /* @__PURE__ */ new Date();
      const currentHM = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const currentDateKey = now.toLocaleDateString("pt-BR") + "_" + currentHM;
      const settings = getNotificationSettingsRepo({ unmasked: true });
      if (settings.email.enabled && settings.email.scheduledReportEnabled && settings.email.scheduledReportTime === currentHM && lastDispatchedDateMinute !== currentDateKey) {
        lastDispatchedDateMinute = currentDateKey;
        const portfolios = getPortfoliosRepo();
        const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
        const res = dispatchScheduledSummaryReportRepo(alerts, settings.officeId, false);
        console.log(`[Scheduler FlowCore] Relat\xF3rio di\xE1rio de conformidade disparado:`, res.message);
      }
    } catch (err) {
      console.error("[Scheduler FlowCore] Erro no loop de agendamento:", err);
    }
  }, 6e4);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlowCore Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
