import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 transition border border-emerald-500/30"
      >
        <Download className="w-3.5 h-3.5" />
        Instalar App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition border border-white/10"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Instalar no iPhone
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-xl relative">
              <h3 className="text-lg font-bold text-white mb-4">Instalar no iPhone / iPad</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                1. Toque no botão de <strong>Compartilhar</strong> na barra do Safari (ícone quadrado com seta para cima).<br /><br />
                2. Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-700 border border-slate-700 transition"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
