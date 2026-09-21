import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  Sliders,
  DollarSign,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { CLIENTS_DIRECTORY, ClientRecord } from '../data/wealthCopilotData';
import { TabKey } from './Header';

interface ClientsDirectoryViewProps {
  onSelectPortfolio: (portfolioId: string) => void;
  onNavigateTab: (tab: TabKey) => void;
}

export const ClientsDirectoryView: React.FC<ClientsDirectoryViewProps> = ({
  onSelectPortfolio,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERRIDE' | 'RECALIBRATION' | 'HEALTHY'>('ALL');

  const filteredClients = useMemo(() => {
    return CLIENTS_DIRECTORY.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.portfolioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mainClass.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      return c.status === statusFilter;
    });
  }, [searchTerm, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: CLIENTS_DIRECTORY.length,
      override: CLIENTS_DIRECTORY.filter((c) => c.status === 'OVERRIDE').length,
      recalibration: CLIENTS_DIRECTORY.filter((c) => c.status === 'RECALIBRATION').length,
      healthy: CLIENTS_DIRECTORY.filter((c) => c.status === 'HEALTHY').length,
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Diretório de Clientes Sob Monitoramento
              </h1>
              <p className="text-xs text-slate-400">
                27 clientes ativos vinculados a mandatos de investimento e regras de suitability.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente ou ativo..."
              className="bg-[#101828] border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('OVERRIDE')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'OVERRIDE'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              Override ({counts.override})
            </button>
            <button
              onClick={() => setStatusFilter('RECALIBRATION')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'RECALIBRATION'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              Recalibração ({counts.recalibration})
            </button>
            <button
              onClick={() => setStatusFilter('HEALTHY')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'HEALTHY'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              Saudáveis ({counts.healthy})
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-200 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Cliente &amp; Mandato</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4 text-right">Patrimônio (AUM)</th>
                <th className="py-3 px-4">Status Regulatório</th>
                <th className="py-3 px-4">Classe Principal / Desvio</th>
                <th className="py-3 px-4">Último Contato</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-cyan-300">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{client.name}</p>
                        <p className="text-[11px] text-slate-300 font-medium">{client.portfolioName}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200">
                      {client.profile}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                    <div>
                      <span>R$ {(client.aumBRL / 1_000_000).toFixed(2)}M</span>
                      <p className="text-[11px] text-slate-300 font-normal">
                        US$ {(client.aumUSD / 1_000_000).toFixed(2)}M
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {client.status === 'OVERRIDE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Em Override
                      </span>
                    )}
                    {client.status === 'RECALIBRATION' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Em Recalibração
                      </span>
                    )}
                    {client.status === 'HEALTHY' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Saudável
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-200">
                    <div>
                      <span className="font-medium">{client.mainClass}</span>
                      {client.deviation > 0 && (
                        <p className="text-[11px] font-bold text-rose-400">
                          {client.currentWeight}% (limite {client.targetWeight}%, +{client.deviation} p.p.)
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    {client.lastContact}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const targetId = client.portfolioId || (
                            client.id === 'cli-dario' ? 'port-dario-001' :
                            client.id === 'cli-miguel' ? 'port-miguel-001' :
                            client.id === 'cli-wilson' ? 'port-wilson-001' :
                            'port-dario-001'
                          );
                          onSelectPortfolio(targetId);
                          onNavigateTab('portfolios');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1 text-[11px]"
                        title="Ver Carteira"
                      >
                        <span>Carteira</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          const targetId = client.portfolioId || (
                            client.id === 'cli-dario' ? 'port-dario-001' :
                            client.id === 'cli-miguel' ? 'port-miguel-001' :
                            client.id === 'cli-wilson' ? 'port-wilson-001' :
                            'port-dario-001'
                          );
                          onSelectPortfolio(targetId);
                          onNavigateTab('simulator');
                        }}
                        className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 transition flex items-center gap-1 text-[11px]"
                        title="Simular Rebalanceamento"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Simular</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
