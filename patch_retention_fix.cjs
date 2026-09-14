const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                  {dispatchLogs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>
              </div>`;

const replacement = `                  {dispatchLogs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                  </div>
                </div>
              </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find target block for fix");
}
