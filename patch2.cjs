const fs = require('fs');
const content = fs.readFileSync('src/components/OwnerCommandCenterView.tsx', 'utf8');
const search = `      {/* Row 4: Advisor Performance Matrix */}`;
const inject = `      {/* Audit History List */}
      <div className="relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-b from-slate-800/70 via-slate-900/80 to-slate-950/90 border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Histórico de Auditoria & Rebalanceamentos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro cronológico de ações fiduciárias e enquadramentos de carteira.
            </p>
          </div>
          <button className="text-xs font-semibold text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/[0.08] hover:text-white hover:border-slate-600 transition flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-y border-white/[0.08]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Data / Hora</th>
                <th className="py-2.5 px-3 font-bold">Usuário / Sistema</th>
                <th className="py-2.5 px-3 font-bold">Carteira Afetada</th>
                <th className="py-2.5 px-3 font-bold">Ação Realizada</th>
                <th className="py-2.5 px-3 font-bold">Detalhes do Ajuste</th>
                <th className="py-2.5 px-3 text-center font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03] transition">
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {log.date}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    {log.user}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {log.portfolio}
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-medium">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={\`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border \${
                      log.status === 'Sucesso'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : log.status === 'Parcial'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }\`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

`;
const newContent = content.replace(search, inject + search);
fs.writeFileSync('src/components/OwnerCommandCenterView.tsx', newContent);
