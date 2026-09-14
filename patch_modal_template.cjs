const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    <div className="space-y-1.5 pt-1">
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
                    
                    {/* Templates Customizados */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400">
                          Template do Assunto:
                        </label>
                        <input
                          type="text"
                          value={settings.email.customSubjectTemplate || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, customSubjectTemplate: e.target.value },
                            })
                          }
                          placeholder="[FlowCore URGENTE] {{portfolioName}} - Desenquadramento em {{assetClass}}"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-400">
                            Template do Corpo da Mensagem:
                          </label>
                          <span className="text-[10px] text-slate-500">Aceita: {{portfolioName}}, {{severity}}, {{assetClass}}, {{message}}, {{currentPercent}}, {{maxPercent}}, {{excessValueBRL}}</span>
                        </div>
                        <textarea
                          value={settings.email.customBodyTemplate || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, customBodyTemplate: e.target.value },
                            })
                          }
                          placeholder="Alerta Crítico: {{message}}. Alocação atual: {{currentPercent}}% (Teto {{maxPercent}}%). Excesso financeiro apurado: R$ {{excessValueBRL}}."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                        />
                      </div>
                    </div>`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
