import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, ChatMessage } from '../types';

interface AiComplianceChatViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  initialQuery?: string;
}

export const AiComplianceChatView: React.FC<AiComplianceChatViewProps> = ({
  portfolios,
  alerts,
  initialQuery = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'agent',
      content: `Olá! Eu sou o **ComplianceAgent do FlowCore**, seu especialista em governança regulatória, desenquadramentos CVM 175, mandatos de investimento (IPS) e estratégias de rebalanceamento.\n\nAtualmente estou monitorando **${portfolios.length} carteiras** e detectei **${alerts.length} alertas de desenquadramento/atenção**. Como posso apoiar o seu comitê de investimentos hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickPrompts = [
    'Quais carteiras estão em desenquadramento crítico hoje e por quê?',
    'Gerar parecer formal de justificativa da Carteira Alpha Wealth para o comitê',
    'Como rebalancear a carteira Solaris Tech sem gerar fricção fiscal excessiva?',
    'Explique os critérios das severidades NORMAL, ATENÇÃO e CRÍTICA no FlowCore',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/compliance/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        content: data?.success ? data.answer : 'Desculpe, ocorreu um erro ao consultar o motor de compliance.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        content: 'Não foi possível conectar ao servidor FlowCore. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                FlowCore AI Compliance Copilot
              </h2>
              <p className="text-xs text-slate-400">
                Assistente de inteligência artificial com leitura em tempo real de custódia e mandatos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Motor Gemini 3.8 Flash Ativo</span>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Consultas Sugeridas:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col h-[560px]">
        {/* Messages scroll list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isAgent ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isAgent
                      ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isAgent
                      ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                      : 'bg-emerald-600 text-white font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">
                      {isAgent ? 'FlowCore ComplianceAgent' : 'Você (Gestor/Auditor)'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body with basic formatting */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>

                  {isAgent && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Parecer copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Parecer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Analisando regras de mandato e gerando diagnóstico de compliance...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2">
          <input
            type="text"
            placeholder="Digite sua dúvida de compliance, solicitação de parecer ou instrução de rebalanceamento..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
