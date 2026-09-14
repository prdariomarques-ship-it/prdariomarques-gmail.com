const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetMethod = `  const filteredLogs = dispatchLogs.filter(log => {`;
const replacementMethod = `  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ['ID', 'Data/Hora', 'Canal', 'Destinatário', 'Status', 'Severidade', 'Carteira', 'Assunto', 'Mensagem'];
    const rows = filteredLogs.map(log => [
      log.id,
      log.sentAt,
      log.channel,
      log.recipient,
      log.status,
      log.severity || '',
      log.portfolioName || '',
      \`"\${(log.subjectOrTitle || '').replace(/"/g, '""')}"\`,
      \`"\${(log.bodyPreview || '').replace(/"/g, '""')}"\`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`auditoria_disparos_\${new Date().getTime()}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = dispatchLogs.filter(log => {`;

const targetUI = `                <div className="flex items-center gap-2">
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
                  )}`;

const replacementUI = `                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredLogs.length === 0}
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition text-xs flex items-center gap-1 disabled:opacity-50"
                    title="Exportar registros filtrados para CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
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
                  )}`;

if (!content.includes(targetMethod)) {
  console.log("Could not find targetMethod block");
} else if (!content.includes(targetUI)) {
  console.log("Could not find targetUI block");
} else {
  content = content.replace(targetMethod, replacementMethod);
  content = content.replace(targetUI, replacementUI);
  fs.writeFileSync(file, content);
  console.log("Success");
}
