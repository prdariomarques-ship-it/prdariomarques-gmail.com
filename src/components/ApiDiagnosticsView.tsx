import React, { useEffect, useState, useMemo } from 'react';
import { getApiRequestHistory, subscribeApiHistoryChange, ApiRequestLog, authenticatedFetch } from '../lib/apiClient';
import { Activity, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ServerCrash, Play, Pause, ChevronDown, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ApiDiagnosticsView: React.FC = () => {
  const [logs, setLogs] = useState<ApiRequestLog[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    // Carrega o histórico inicial e se inscreve para atualizações
    setLogs(getApiRequestHistory());
    const unsubscribe = subscribeApiHistoryChange((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    // Ping test
    const pingApi = async () => {
      try {
        await authenticatedFetch(`/api/notifications/settings?_t=${Date.now()}`);
      } catch {
        // network error already logged by authenticatedFetch
      }
    };

    // Execute immediately on mount if polling is active
    pingApi();
    
    // Set interval for every 10 seconds
    const interval = setInterval(pingApi, 10000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const getStatusColor = (status: number | null) => {
    if (status === null) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
  };

  const getStatusIcon = (status: number | null) => {
    if (status === null) return <ServerCrash className="w-4 h-4" />;
    if (status >= 200 && status < 300) return <CheckCircle2 className="w-4 h-4" />;
    if (status >= 400 && status < 500) return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };

  const chartData = useMemo(() => {
    // Reverse so the oldest is on the left, newest on the right
    return [...logs].reverse().map(log => {
      const date = new Date(log.timestamp);
      let shortUrl = log.url;
      try {
        if (log.url.startsWith('http')) {
          shortUrl = new URL(log.url).pathname;
        }
      } catch (e) {
        // fallback
      }
      return {
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
        latency: log.duration,
        status: log.status,
        url: shortUrl,
        fullTime: formatTime(log.timestamp),
      };
    });
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-400" />
            API Health & Diagnostics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento em tempo real das últimas chamadas de API (Status, Latência e Autenticação).
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              isPolling 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPolling ? 'Auto-Ping Ativo (10s)' : 'Auto-Ping Pausado'}</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Últimas 20 requisições</span>
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Tendência de Latência (ms)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}ms`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', fontSize: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                  labelStyle={{ color: '#cbd5e1', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} ms`, 'Latência']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return `${data.fullTime} - ${data.url}`;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#818cf8" 
                  strokeWidth={2} 
                  dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#1e293b', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium w-full">URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Latência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-slate-600 mb-3 animate-spin-slow" />
                      <p>Nenhuma requisição API registrada na sessão atual.</p>
                      <p className="text-xs mt-1">Interaja com o painel para gerar tráfego.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${expandedLogId === log.id ? 'bg-slate-800/40' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-4 py-3 text-slate-500">
                        {expandedLogId === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs truncate max-w-md" title={log.url}>
                        {log.url}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(log.status)}`} title={log.error}>
                          {getStatusIcon(log.status)}
                          <span>{log.status === null ? 'FALHA' : log.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs ${log.duration > 1000 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {log.duration} ms
                        </span>
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-slate-900/80 border-b-0">
                        <td colSpan={6} className="px-4 py-4 border-b border-slate-700/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Request Section */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Headers</h4>
                              <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800">
                                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
                                  {log.reqHeaders && Object.keys(log.reqHeaders).length > 0 
                                    ? Object.entries(log.reqHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')
                                    : 'Nenhum cabeçalho customizado capturado.'}
                                </pre>
                              </div>

                              {log.reqBody && (
                                <>
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Request Payload</h4>
                                  <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800">
                                    <pre className="text-xs text-amber-300 font-mono whitespace-pre-wrap">
                                      {log.reqBody}
                                    </pre>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Response Section */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response Payload</h4>
                              <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800 h-full max-h-64 overflow-y-auto">
                                <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap">
                                  {log.resBody ? log.resBody : (log.status === null ? (log.error || 'Falha na conexão de rede. Sem resposta do servidor.') : 'Resposta vazia (sem corpo).')}
                                </pre>
                              </div>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
