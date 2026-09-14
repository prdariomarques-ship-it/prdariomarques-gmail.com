import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`space-y-2 text-xs leading-relaxed text-slate-200 ${className}`}>
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-white mt-2 mb-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-white mt-2 mb-1 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-emerald-400 mt-2 mb-1 flex items-center gap-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11px] font-semibold text-cyan-300 mt-1.5 mb-0.5 uppercase tracking-wider">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="leading-relaxed mb-1.5">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-slate-400 italic text-[11px]">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[11px] border border-slate-800">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500/60 pl-2.5 py-0.5 my-1.5 text-slate-300 italic bg-emerald-500/5 rounded-r">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-slate-800 my-2" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
