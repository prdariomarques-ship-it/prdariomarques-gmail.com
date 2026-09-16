import React, { useState, useEffect } from 'react';
import { PortfoliosView } from './components/PortfoliosView';
import { BarbellStrategyView } from './components/BarbellStrategyView';
import { Portfolio } from './types';
import { LayoutDashboard, Dumbbell } from 'lucide-react';

// Using a custom TabKey type since we're bypassing the deleted Header component
type TabKey = 'portfolios' | 'barbell';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('portfolios');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch('/api/portfolios');
        const data = await response.json();
        if (data.success && data.portfolios.length > 0) {
          setPortfolios(data.portfolios);
          setSelectedPortfolioId(data.portfolios[0].id);
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolios();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/20">
              PMX
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Wealth <span className="text-blue-500 font-medium">Compliance</span>
            </h1>
          </div>
          
          {/* Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/60 shadow-inner">
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'portfolios' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard size={18} />
              Client Portfolios
            </button>
            <button
              onClick={() => setActiveTab('barbell')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'barbell' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Dumbbell size={18} />
              Barbell Strategy
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full"></div>
              <span className="text-slate-400 font-medium">Loading portfolios...</span>
            </div>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="text-slate-500" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">No Portfolios Found</h2>
              <p className="text-slate-400">There was an issue loading the client portfolio data from the server.</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
            {activeTab === 'portfolios' ? (
              <PortfoliosView
                portfolios={portfolios}
                selectedPortfolioId={selectedPortfolioId}
                onSelectPortfolio={setSelectedPortfolioId}
                onStartRebalance={(id) => console.log('Rebalance requested for:', id)}
                onOpenAgentWithPortfolio={(id) => console.log('Agent requested for:', id)}
              />
            ) : (
              <BarbellStrategyView
                portfolios={portfolios}
                onNavigateTab={(tab) => {
                  // Ignore navigations to deleted tabs, only support our two
                  if (tab === 'portfolios') setActiveTab('portfolios');
                }}
                onSelectPortfolio={setSelectedPortfolioId}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
