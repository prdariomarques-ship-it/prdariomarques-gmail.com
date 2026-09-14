const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              ) : filteredLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Search className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum registro encontrado para "{logSearchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">`;

const replacement = `              ) : filteredLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Search className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum registro encontrado para "{logSearchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 relative">
                  {Object.entries(
                    filteredLogs.reduce((acc, log) => {
                      const dateStr = log.sentAt.split(' ')[0] || 'Data Desconhecida';
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(log);
                      return acc;
                    }, {})
                  ).map(([date, logs]) => (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 py-1.5 px-2 -mx-2 border-y border-slate-800/60 mb-2">
                         <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5" />
                           {date}
                           <span className="text-[10px] font-normal text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">
                             {logs.length} envios
                           </span>
                         </h5>
                      </div>
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  
  // Now replace the end of the map
  const targetEnd = `                          <Check className="w-3 h-3" />
                          Entregue
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}`;
              
  const replacementEnd = `                          <Check className="w-3 h-3" />
                          Entregue
                        </span>
                      </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}`;
              
  if (content.includes(targetEnd)) {
    content = content.replace(targetEnd, replacementEnd);
    fs.writeFileSync(file, content);
    console.log("Success");
  } else {
    console.log("Could not find end block");
  }
}
