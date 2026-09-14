const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.sendOnCriticalOnly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, sendOnCriticalOnly: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Notificar apenas para desenquadramentos de severidade <strong>CRÍTICA</strong></span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.includeReportAttachment}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, includeReportAttachment: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Incluir sumário da carteira em anexo CSV (UTF-8)</span>
                        </span>
                      </label>
                    </div>`;

const replacement = `                    <div className="space-y-1.5 pt-1">
                      {/* Note: 'Notificar apenas CRÍTICA' has been superseded by the individual filters below but kept for retro-compatibility or quick toggle if needed. */}
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.sendOnCriticalOnly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, sendOnCriticalOnly: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Notificar apenas para desenquadramentos de severidade <strong>CRÍTICA</strong></span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.includeReportAttachment}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, includeReportAttachment: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Incluir sumário da carteira em anexo CSV (UTF-8)</span>
                        </span>
                      </label>
                    </div>

                    {/* NEW: Filtro de Severidade e Classes de Ativos */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        Filtros de Disparo Específicos
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Severidades */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severidade do Alerta</span>
                          <div className="flex flex-col gap-2">
                            {['CRITICAL', 'WARNING', 'NORMAL'].map((sev) => {
                              const checked = settings.email.severitiesFilter?.includes(sev as any) ?? true;
                              return (
                                <label key={sev} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = settings.email.severitiesFilter || ['CRITICAL', 'WARNING', 'NORMAL'];
                                      let updated = [...current];
                                      if (e.target.checked && !updated.includes(sev as any)) updated.push(sev as any);
                                      if (!e.target.checked) updated = updated.filter(s => s !== sev);
                                      setSettings({
                                        ...settings,
                                        email: { ...settings.email, severitiesFilter: updated },
                                      });
                                    }}
                                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className={sev === 'CRITICAL' ? 'text-rose-400 font-bold' : sev === 'WARNING' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                    {sev === 'CRITICAL' ? 'Crítica' : sev === 'WARNING' ? 'Atenção (Warning)' : 'Normal'}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Classes de Ativos */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classe de Ativo</span>
                          <div className="flex flex-col gap-2">
                            {['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'].map((asset) => {
                              const checked = settings.email.assetClassesFilter?.includes(asset as any) ?? true;
                              return (
                                <label key={asset} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = settings.email.assetClassesFilter || ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'];
                                      let updated = [...current];
                                      if (e.target.checked && !updated.includes(asset as any)) updated.push(asset as any);
                                      if (!e.target.checked) updated = updated.filter(a => a !== asset);
                                      setSettings({
                                        ...settings,
                                        email: { ...settings.email, assetClassesFilter: updated },
                                      });
                                    }}
                                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span>{asset}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
