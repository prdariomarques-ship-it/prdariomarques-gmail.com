const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationSettingsModal.tsx', 'utf-8');
const searchString = `                    </div>\n                  </div>\n                </div>\n              </div>\n\n              {/* SMS Config */}`;

// Let's first check if we can find where to insert.
const insertPoint = `                        <span className="flex items-center gap-1">\n                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />\n                          <span>Incluir sumário da carteira em anexo CSV (UTF-8)</span>\n                        </span>\n                      </label>\n                    </div>`;

const newCode = insertPoint + `

                    {/* Report Scheduling */}
                    <div className="pt-4 mt-4 border-t border-slate-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300">Relatório de Conformidade Agendado</h4>
                          <p className="text-xs text-slate-500 mt-1">Receba um resumo periódico da carteira por e-mail, independente de alertas.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.email.scheduledReportEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportEnabled: e.target.checked },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {settings.email.scheduledReportEnabled && (
                        <div className="mt-3 pl-1 flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Horário diário:</span>
                          <input
                            type="time"
                            value={settings.email.scheduledReportTime || '08:00'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportTime: e.target.value },
                              })
                            }
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      )}
                    </div>`;

code = code.replace(insertPoint, newCode);
fs.writeFileSync('src/components/NotificationSettingsModal.tsx', code);
