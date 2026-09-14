const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                          placeholder="Alerta Crítico: {{message}}. Alocação atual: {{currentPercent}}% (Teto {{maxPercent}}%). Excesso financeiro apurado: R$ {{excessValueBRL}}."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                        />
                      </div>
                    </div>`;

const replacement = `                          placeholder="Alerta Crítico: {{message}}. Alocação atual: {{currentPercent}}% (Teto {{maxPercent}}%). Excesso financeiro apurado: R$ {{excessValueBRL}}."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                        />
                        <div className="flex justify-end mt-1">
                          <span className={\`text-[10px] \${(settings.email.customBodyTemplate?.length || 0) > 250 ? 'text-amber-500' : 'text-slate-500'}\`}>
                            {(settings.email.customBodyTemplate?.length || 0)} caracteres
                            {(settings.email.customBodyTemplate?.length || 0) > 250 && ' (Pode ser truncado em alguns dispositivos móveis)'}
                          </span>
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
