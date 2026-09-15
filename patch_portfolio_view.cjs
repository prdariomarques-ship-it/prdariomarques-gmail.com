const fs = require('fs');
let code = fs.readFileSync('src/components/PortfoliosView.tsx', 'utf-8');

const importTarget = "import { Portfolio } from '../types';";
const importNew = "import { Portfolio, Asset } from '../types';\nimport { ChevronDown, ChevronUp, TrendingUp, AlertCircle } from 'lucide-react';";
code = code.replace(importTarget, importNew);
if(code.indexOf('ChevronDown') === -1) {
  // Try another approach to inject imports
  code = code.replace("import React from 'react';", "import React, { useState } from 'react';\nimport { ChevronDown, ChevronUp, TrendingUp, AlertCircle } from 'lucide-react';");
} else {
  code = code.replace("import React from 'react';", "import React, { useState } from 'react';");
}

const stateTarget = "const [currentPortfolio, setCurrentPortfolio] = React.useState<Portfolio | null>(null);";
const stateNew = "const [currentPortfolio, setCurrentPortfolio] = React.useState<Portfolio | null>(null);\n  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);";
code = code.replace(stateTarget, stateNew);

const trStart = `<tr key={asset.id} className="hover:bg-slate-800/40 transition">`;
const trStartNew = `<React.Fragment key={asset.id}>
                      <tr 
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                        onClick={() => setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id)}
                      >`;
code = code.replace(trStart, trStartNew);
// The map will have multiple returns? No, the map has only one `return (<tr... </tr>)`

const trEnd = `                        </td>
                      </tr>`;
const trEndNew = `                        </td>
                      </tr>
                      {expandedAssetId === asset.id && (
                        <tr className="bg-slate-900/50">
                          <td colSpan={7} className="p-0 border-b border-white/[0.05]">
                            <div className="p-4 border-l-2 border-emerald-500/50 m-2 rounded-r-lg bg-slate-950/40">
                              <div className="flex items-center space-x-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                  Performance Histórica - {asset.ticker}
                                </h4>
                              </div>
                              
                              {!asset.historicalPerformance ? (
                                <div className="flex items-center space-x-2 text-slate-400 text-xs italic bg-slate-900/50 p-3 rounded border border-white/5">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Histórico não disponível para este ativo (dados privados, não fornecidos ou sem cotação pública).</span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                  {[
                                    { label: 'Diário', val: asset.historicalPerformance.daily },
                                    { label: 'Mensal', val: asset.historicalPerformance.monthly },
                                    { label: 'Semestral', val: asset.historicalPerformance.sixMonths },
                                    { label: 'No Ano (YTD)', val: asset.historicalPerformance.ytd },
                                    { label: '12 Meses', val: asset.historicalPerformance.twelveMonths },
                                    { label: '24 Meses', val: asset.historicalPerformance.twentyFourMonths },
                                    { label: '36 Meses', val: asset.historicalPerformance.thirtySixMonths },
                                    { label: 'Desde Início', val: asset.historicalPerformance.inception }
                                  ].map((window, idx) => (
                                    <div key={idx} className="bg-slate-900 border border-white/10 p-2 rounded flex flex-col items-center justify-center">
                                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 text-center">{window.label}</span>
                                      {window.val !== undefined ? (
                                        <span className={\`text-xs font-mono font-bold \${window.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                                          {window.val > 0 ? '+' : ''}{window.val.toFixed(2)}%
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-600 font-mono">N/D</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="mt-3 flex gap-4 text-[10px] text-slate-500 font-mono">
                                {asset.cnpj && <span>CNPJ: {asset.cnpj}</span>}
                                {asset.productType && <span className="uppercase">TIPO: {asset.productType.replace('_', ' ')}</span>}
                                {asset.isTaxExempt !== undefined && <span>IR: {asset.isTaxExempt ? 'ISENTO' : 'TRIBUTADO'}</span>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>`;
code = code.replace(trEnd, trEndNew);

fs.writeFileSync('src/components/PortfoliosView.tsx', code);
console.log('patched view');
