import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  Server,
  Share2,
} from 'lucide-react';
import {
  getAuthToken,
  setAuthToken,
  testTokenValidation,
  DEFAULT_DEV_TOKEN,
  subscribeAuthChange,
  subscribeAuthStatusChange,
} from '../../lib/apiClient';

interface ApiSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSecurityModal: React.FC<ApiSecurityModalProps> = ({ isOpen, onClose }) => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    status: number;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTokenInput(getAuthToken());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setAuthToken(tokenInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRestoreDefault = () => {
    setTokenInput(DEFAULT_DEV_TOKEN);
    setAuthToken(DEFAULT_DEV_TOKEN);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestToken = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testTokenValidation(tokenInput);
      setTestResult({
        tested: true,
        ...res,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenInput);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyUrlWithToken = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('token', tokenInput.trim());
    navigator.clipboard.writeText(url.toString());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      id="api-security-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="api-security-modal-container"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Segurança & Autenticação da API
              </h3>
              <p className="text-xs text-slate-400">
                Token Bearer obrigatório em todas as rotas <code className="text-emerald-300">/api/*</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regras e contexto da auditoria */}
        <div className="my-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Lock className="w-4 h-4" />
            <span>Middleware de Proteção Ativo (CVM 175 & ISO 27001)</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Qualquer requisição externa para a API do Sentinel sem o header{' '}
            <span className="font-mono text-slate-200">Authorization: Bearer &lt;token&gt;</span> é
            bloqueada imediatamente com status <strong>HTTP 401 Unauthorized</strong>.
          </p>
        </div>

        {/* Campo de Input do Token */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Token de Autorização (API_TOKEN):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Salvo em localStorage</span>
            </label>

            <div className="relative flex items-center">
              <input
                id="api-token-input-field"
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Insira seu token de API seguro..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-20 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />

              <div className="absolute right-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? 'Ocultar token' : 'Exibir token'}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition hover:bg-slate-800"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  title="Copiar token para a área de transferência"
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition hover:bg-slate-800"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Ações de Botões */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              id="save-api-token-btn"
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar Token</span>
                </>
              )}
            </button>

            <button
              id="test-api-token-btn"
              onClick={handleTestToken}
              disabled={isTesting || !tokenInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isTesting ? 'Validando...' : 'Testar Conexão'}</span>
            </button>

            <button
              id="copy-url-token-btn"
              onClick={handleCopyUrlWithToken}
              title="Gera URL compartilhável com o parâmetro ?token=..."
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">URL Copiada!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Link com Token</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRestoreDefault}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline transition cursor-pointer"
            >
              Restaurar Token Padrão do Ambiente
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Header: <code className="text-slate-400">Authorization: Bearer ***</code>
            </span>
          </div>
        </div>

        {/* Resultado do Teste de Conexão */}
        {testResult && testResult.tested && (
          <div
            id="token-validation-feedback"
            className={`mt-4 p-3 rounded-xl border text-xs animate-in fade-in duration-150 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">
                    {testResult.success
                      ? 'Autenticação Aprovada (HTTP 200 OK)'
                      : `Acesso Negado (HTTP ${testResult.status})`}
                  </span>
                  <span className="font-mono text-[10px] opacity-80">
                    Latência: {testResult.latencyMs} ms
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Endpoint verificado: <code className="text-slate-300">GET /api/notifications/settings</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span>FlowCore Sentinel Security Layer</span>
          <span>Variável: API_TOKEN</span>
        </div>
      </div>
    </div>
  );
};
