import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, ShieldAlert } from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';

interface AiComplianceChatViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AiComplianceChatView: React.FC<AiComplianceChatViewProps> = ({ portfolios, alerts, initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Olá! Sou o Agente de Compliance e Risco. Como posso ajudar com a análise das carteiras e enquadramentos regulatórios hoje?',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      handleSendMessage(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const cvm175Prompts = useMemo(() => {
    const criticalCvmAlerts = alerts.filter(a => 
      a.severity === 'CRITICAL' && 
      (a.policyId?.includes('CVM') || a.policy_id?.includes('CVM') || a.message.includes('CVM') || a.ruleSource?.includes('CVM'))
    );

    const sourceAlerts = criticalCvmAlerts.length > 0 
      ? criticalCvmAlerts 
      : alerts.filter(a => a.severity === 'CRITICAL');

    if (sourceAlerts.length === 0) {
      return [
        "Simule o impacto de um estresse cambial de +10% sobre o limite de ativos no exterior da CVM 175.",
        "Quais os critérios da Resolução CVM 175 para enquadramento de fundos de crédito privado?",
        "Avalie a liquidez atual das carteiras frente aos limites da CVM 175."
      ];
    }

    const dynamicPrompts = sourceAlerts.slice(0, 3).map(alert => {
      const assetClass = alert.assetClass;
      const portName = alert.portfolioName || alert.clientName || 'Carteira';
      return `Realize uma análise de risco CVM 175 para a carteira ${portName} focada no limite estourado de ${assetClass} (${alert.deviationPP > 0 ? '+' : ''}${alert.deviationPP.toFixed(2)} p.p.).`;
    });

    if (dynamicPrompts.length < 3) {
      dynamicPrompts.push("Resuma os principais desenquadramentos da CVM 175 ativos no momento e sugira planos de ação.");
    }
    
    return dynamicPrompts.slice(0, 3);
  }, [alerts]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock API response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Realizei a análise baseada na sua solicitação sobre "${text}".\n\nNo momento, estou operando em modo de simulação, mas se os dados estivessem conectados à API ao vivo, eu detalharia os riscos fiduciários, planos de enquadramento estruturados e impacto no VaR da carteira, em conformidade com as diretrizes CVM 175 e políticas internas.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-950/40 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">FlowCore Compliance AI</h2>
            <p className="text-[11px] text-slate-400">Modelo de IA especializado em Riscos e CVM 175</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                msg.role === 'user' 
                  ? 'bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%] flex-row">
              <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-none flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions & Input */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sugestões Rápidas: Análise de Risco CVM 175
          </div>
          <div className="flex flex-wrap gap-2">
            {cvm175Prompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-left px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 rounded-lg text-xs text-slate-300 hover:text-indigo-300 transition-colors flex items-start gap-2 max-w-full"
              >
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70 text-rose-400" />
                <span className="line-clamp-2">{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte à IA sobre conformidade, limites e regulações (Ex: CVM 175)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
