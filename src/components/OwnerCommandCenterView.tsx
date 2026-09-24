import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  FileCheck,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, DataMode } from '../types';
import { TabKey } from './Header';
import { useUserProfile } from '../hooks/useUserProfile';

interface OwnerCommandCenterViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
  onStartRebalance?: (portfolioId: string) => void;
  dataMode?: DataMode;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  portfolioName: string;
  operator: string;
  regulationRule: string;
  status: 'APPROVED' | 'COMPLIANT' | 'FLAGGED';
  hash: string;
}

export const OwnerCommandCenterView: React.FC<OwnerCommandCenterViewProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onNavigateTab,
  onStartRebalance,
  dataMode = 'LIVE',
}) => {
  const { photoUrl } = useUserProfile();
  const [selectedPortfolioFilter, setSelectedPortfolioFilter] = useState<string>('ALL');
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadReport = (reportName: string, id: string) => {
    setDownloadingReportId(id);
    setTimeout(() => {
      setDownloadingReportId(null);
      showToast(`Relatório "${reportName}" compilado e emitido com sucesso.`);
    }, 1200);
  };

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'log-001',
      timestamp: '2026-09-20 19:42:15',
      action: 'Auditoria de Enquadramento CVM 175 Anexo Normativo I',
      portfolioName: 'Carteira Dário (Dário Marques Neto)',
      operator: 'Dário Marques Neto (Gestor)',
      regulationRule: 'Art. 89 — Limites de Concentração Offshore',
      status: 'COMPLIANT',
      hash: 'sha256-e8f910ab3c89...',
    },
    {
      id: 'log-002',
      timestamp: '2026-09-20 18:15:02',
      action: 'Verificação de Limite de Renda Variável (Alerta 42%)',
      portfolioName: 'Carteira Miguel',
      operator: 'Sistema Sentinel CVM',
      regulationRule: 'IPS Bilateral — Teto RV 30%',
      status: 'FLAGGED',
      hash: 'sha256-4b21fa79e120...',
    },
    {
      id: 'log-003',
      timestamp: '2026-09-20 17:30:45',
      action: 'Monitoramento de Crédito Privado Bancário & Debêntures',
      portfolioName: 'Carteira Wilson',
      operator: 'Sistema Sentinel CVM',
      regulationRule: 'IPS Bilateral — Teto Crédito 15%',
      status: 'FLAGGED',
      hash: 'sha256-991dfa52b618...',
    },
    {
      id: 'log-004',
      timestamp: '2026-09-20 14:00:10',
      action: 'Aprovação de Rebalanceamento Tático Semestral',
      portfolioName: 'Carteira Dário',
      operator: 'Dário Marques Neto (Gestor)',
      regulationRule: 'Governança Fiduciária MPX Wealth',
      status: 'APPROVED',
      hash: 'sha256-a194cbe87192...',
    },
    {
      id: 'log-005',
      timestamp: '2026-09-20 11:22:30',
      action: 'Validação de Saldo em Conta de Custódia Avenue & Itaú',
      portfolioName: 'Todas as Carteiras',
      operator: 'Sentinel Custódia Integrada',
      regulationRule: 'Resolução CVM 175 Art. 12',
      status: 'COMPLIANT',
      hash: 'sha256-628d01f54c93...',
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedPortfolioFilter === 'ALL') return true;
    return log.portfolioName.toLowerCase().includes(selectedPortfolioFilter.toLowerCase());
  });

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningAlertsCount = alerts.filter((a) => a.severity === 'WARNING').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-800/90">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Central de Relatórios &amp; Governança CVM 175
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Trilha Regulatória
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Emissão de pareceres fiduciários, atestados de conformidade e registro imutável de auditoria.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="font-semibold text-cyan-400">MPX Wealth Management</span>
            <span>•</span>
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-200">
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-slate-900 border border-cyan-500/40 shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Dário Marques" className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full bg-cyan-600 flex items-center justify-center text-[8px] font-bold text-white">
                    DM
                  </div>
                )}
              </div>
              <span>Gestor Responsável: Dário Marques Neto</span>
            </div>
            <span>•</span>
            <span className="text-slate-500">Modo: {dataMode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              handleDownloadReport(
                'Dossiê Consolidado de Conformidade CVM 175 & Mandatos',
                'full-dossier'
              )
            }
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-blue-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Emitir Dossiê Completo CVM 175</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Carteiras Auditadas</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{portfolios.length}</span>
            <span className="text-xs text-slate-500 block">Dário, Miguel, Wilson e demais</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Atestados Emitidos</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-300">100%</span>
            <span className="text-xs text-slate-500 block">Trilha de auditoria ativa</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300 uppercase">Alertas Ativos</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-400">{criticalAlertsCount + warningAlertsCount}</span>
            <span className="text-xs text-slate-500 block">{criticalAlertsCount} críticos, {warningAlertsCount} avisos</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Assinatura Digital</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-bold text-emerald-400">ICP-Brasil / SHA-256</span>
            <span className="text-xs text-slate-500 block">Fiduciariamente válido</span>
          </div>
        </div>
      </div>

      {/* Relatórios Oficiais CVM 175 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Documentos &amp; Relatórios Oficiais Disponíveis
            </h2>
            <p className="text-xs text-slate-400">
              Download instantâneo dos relatórios fiduciários exigidos pelos órgãos reguladores e comitê interno de risco.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">Formato: PDF Assinado Digitalmente</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Doc 1 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Mensal Obrigatório
                </span>
                <span className="text-[10px] text-slate-300 font-medium">CVM 175</span>
              </div>
              <h3 className="font-bold text-white text-sm mt-2">
                Relatório Mensal de Enquadramento Fiduciário
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Consolidado de todas as carteiras de clientes sob gestão da MPX Wealth Management com demonstrativo de aderência aos mandatos.
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('Relatório Mensal de Enquadramento Fiduciário', 'rep-1')}
              disabled={downloadingReportId === 'rep-1'}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingReportId === 'rep-1' ? 'Gerando PDF...' : 'Baixar Relatório (PDF)'}</span>
            </button>
          </div>

          {/* Doc 2 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Compliance
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Tempo Real</span>
              </div>
              <h3 className="font-bold text-white text-sm mt-2">
                Parecer de Desenquadramentos Ativos &amp; Planos de Cura
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Detalhamento dos desvios vigentes (Miguel, Wilson e outros), causas-raiz de mercado e propostas de regularização (Art. 89).
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('Parecer de Desenquadramentos Ativos', 'rep-2')}
              disabled={downloadingReportId === 'rep-2'}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingReportId === 'rep-2' ? 'Gerando PDF...' : 'Baixar Parecer (PDF)'}</span>
            </button>
          </div>

          {/* Doc 3 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multicarteira
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Itaú + Avenue</span>
              </div>
              <h3 className="font-bold text-white text-sm mt-2">
                Extrato Executivo Carteira Dário Marques Neto
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Posição individualizada dos ativos locais e offshore (Itaú Private + Avenue) com métricas de duration, beta e liquidez.
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('Extrato Executivo Carteira Dário Marques Neto', 'rep-3')}
              disabled={downloadingReportId === 'rep-3'}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingReportId === 'rep-3' ? 'Gerando PDF...' : 'Baixar Extrato (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trilha de Auditoria Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Trilha de Auditoria &amp; Registro de Ações Fiduciárias
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Histórico cronológico de verificações normativas, overrides e simulações com identificador criptográfico.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPortfolioFilter}
              onChange={(e) => setSelectedPortfolioFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas as Carteiras</option>
              <option value="Dário">Carteira Dário</option>
              <option value="Miguel">Carteira Miguel</option>
              <option value="Wilson">Carteira Wilson</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
              <tr>
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Ação / Evento</th>
                <th className="py-3 px-4">Carteira Afetada</th>
                <th className="py-3 px-4">Regra Normativa</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Hash CVM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono text-slate-300">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-white">{log.action}</td>
                  <td className="py-3 px-4 text-slate-200">{log.portfolioName}</td>
                  <td className="py-3 px-4 text-slate-300">{log.regulationRule}</td>
                  <td className="py-3 px-4 text-slate-200">{log.operator}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'COMPLIANT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.status === 'APPROVED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {log.status === 'COMPLIANT'
                        ? 'Conforme'
                        : log.status === 'APPROVED'
                        ? 'Aprovado'
                        : 'Alerta'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300 text-[11px]">
                    {log.hash}
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
