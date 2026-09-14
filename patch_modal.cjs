const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                      </div>
                    </div>

                    {/* NEW: Filtro de Severidade e Classes de Ativos */}`;

const replacement = `                      </div>
                    </div>

                    {/* NEW: Agendamento de Resumo de Conformidade */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          Agendamento de Resumo de Conformidade
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.email.scheduledReportEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportEnabled: e.target.checked },
                              })
                            }
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      <div className={\`grid grid-cols-2 gap-4 transition-all duration-300 \${settings.email.scheduledReportEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}\`}>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400">Dia da Semana</label>
                          <select
                            value={settings.email.scheduledReportDayOfWeek || '1'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportDayOfWeek: e.target.value },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                          >
                            <option value="1">Segunda-feira</option>
                            <option value="2">Terça-feira</option>
                            <option value="3">Quarta-feira</option>
                            <option value="4">Quinta-feira</option>
                            <option value="5">Sexta-feira</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400">Horário</label>
                          <input
                            type="time"
                            value={settings.email.scheduledReportTime || '08:00'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportTime: e.target.value },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* NEW: Filtro de Severidade e Classes de Ativos */}`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
