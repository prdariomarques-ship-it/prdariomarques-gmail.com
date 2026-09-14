const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                        {/* Severidades */}
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
                        </div>`;

const replacement = `                        {/* Severidades */}
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severidade do Alerta</span>
                          <div className="flex flex-col gap-2.5">
                            {['CRITICAL', 'WARNING', 'NORMAL'].map((sev) => {
                              const checked = settings.email.severitiesFilter?.includes(sev as any) ?? true;
                              return (
                                <div key={sev} className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-white/[0.04]">
                                  <span className={sev === 'CRITICAL' ? 'text-rose-400 font-bold text-xs' : sev === 'WARNING' ? 'text-amber-400 font-bold text-xs' : 'text-slate-300 text-xs font-medium'}>
                                    {sev === 'CRITICAL' ? 'Crítica' : sev === 'WARNING' ? 'Atenção (Warning)' : 'Normal'}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = settings.email.severitiesFilter || ['CRITICAL', 'WARNING', 'NORMAL'];
                                        let updated = [...current];
                                        if (e.target.checked && !updated.includes(sev as any)) updated.push(sev as any);
                                        if (!e.target.checked) updated = updated.filter(s => s !== sev);
                                        
                                        const newSettings = {
                                          ...settings,
                                          email: { ...settings.email, severitiesFilter: updated },
                                        };
                                        setSettings(newSettings);
                                        // Salva localmente e propaga para o servidor imediatamente
                                        onSaveSettings(newSettings).catch(err => console.error("Falha ao salvar o filtro automaticamente:", err));
                                      }}
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
