const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRender = `  return (
    <div
      id="notification-settings-modal"`;
const replacementRender = `  const filteredLogs = dispatchLogs.filter(log => {
    const q = logSearchQuery.toLowerCase();
    return (
      log.recipient.toLowerCase().includes(q) ||
      log.channel.toLowerCase().includes(q) ||
      (log.subjectOrTitle && log.subjectOrTitle.toLowerCase().includes(q)) ||
      (log.bodyPreview && log.bodyPreview.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="notification-settings-modal"`;

const targetTab = `            /* Tab 2: Dispatch Logs */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Registros de auditoria de disparos para canais secundários (E-mail e SMS)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshLogs}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                    title="Atualizar registros"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Atualizar</span>
                  </button>
                  {dispatchLogs.length > 0 && (
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

              {dispatchLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum despacho secundário registrado até o momento.</p>
                  <button
                    onClick={() => handleTest('ALL')}
                    className="mt-2 text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Disparar teste de verificação
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {dispatchLogs.map((log) => (`;

const replacementTab = `            /* Tab 2: Dispatch Logs */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Registros de auditoria de disparos para canais secundários (E-mail e SMS)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshLogs}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                    title="Atualizar registros"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Atualizar</span>
                  </button>
                  {dispatchLogs.length > 0 && (
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
              
              {dispatchLogs.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Pesquisar por destinatário, canal, assunto ou mensagem..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {dispatchLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum despacho secundário registrado até o momento.</p>
                  <button
                    onClick={() => handleTest('ALL')}
                    className="mt-2 text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Disparar teste de verificação
                  </button>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Search className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum registro encontrado para "{logSearchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => (`;

if (!content.includes(targetRender)) {
  console.log("Could not find targetRender block");
} else if (!content.includes(targetTab)) {
  console.log("Could not find targetTab block");
} else {
  content = content.replace(targetRender, replacementRender);
  content = content.replace(targetTab, replacementTab);
  fs.writeFileSync(file, content);
  console.log("Success");
}
