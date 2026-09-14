const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            /* Tab 2: Dispatch Logs */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Registros de auditoria de disparos para canais secundários (E-mail e SMS)
                </p>
                <div className="flex items-center gap-2">`;

const replacement = `            /* Tab 2: Dispatch Logs */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Registros de auditoria de disparos para canais secundários (E-mail e SMS)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border-r border-slate-800/80 pr-3">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider" title="Tempo de retenção automática dos logs">Retenção:</span>
                    <select
                      value={settings.logRetentionDays || 30}
                      onChange={(e) => setSettings({ ...settings, logRetentionDays: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded focus:outline-none focus:border-emerald-500 py-0.5 px-1"
                    >
                      <option value={7}>7 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find target block in modal");
}
