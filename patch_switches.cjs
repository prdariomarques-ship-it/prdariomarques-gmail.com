const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                        {/* Classes de Ativos */}
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
                        </div>`;

const replacement = `                        {/* Classes de Ativos */}
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classe de Ativo</span>
                          <div className="flex flex-col gap-2.5">
                            {['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'].map((asset) => {
                              const checked = settings.email.assetClassesFilter?.includes(asset as any) ?? true;
                              return (
                                <div key={asset} className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-white/[0.04]">
                                  <span className="text-xs text-slate-300 font-medium">{asset}</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = settings.email.assetClassesFilter || ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'];
                                        let updated = [...current];
                                        if (e.target.checked && !updated.includes(asset as any)) updated.push(asset as any);
                                        if (!e.target.checked) updated = updated.filter(a => a !== asset);
                                        
                                        const newSettings = {
                                          ...settings,
                                          email: { ...settings.email, assetClassesFilter: updated },
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
