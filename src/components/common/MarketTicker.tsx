import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const marketData = [
  { symbol: "Ibovespa", value: "185.500,88", change: -0.91 },
  { symbol: "Brent", value: "US$ 105,68", change: 1.02 },
  { symbol: "WTI", value: "US$ 101,39", change: 1.34 },
  { symbol: "Dólar", value: "R$ 5,1479", change: 0.44 },
  { symbol: "DXY", value: "99,47", change: 0.36 },
  { symbol: "S&P 500", value: "7.619,94", change: -0.48 },
  { symbol: "Nasdaq", value: "26.186,41", change: -0.56 },
  { symbol: "Dow Jones", value: "52.421,17", change: -0.29 },
  { symbol: "Stoxx 600", value: "635,99", change: -0.49 },
  { symbol: "Euro Stoxx 50", value: "6.256,60", change: -1.08 },
  { symbol: "DAX", value: "25.415,06", change: -0.60 },
  { symbol: "CAC 40", value: "8.117,78", change: -0.76 },
  { symbol: "FTSE 100", value: "10.697,57", change: 0.44 },
  { symbol: "Nikkei", value: "63.492,99", change: -0.81 },
  { symbol: "Hang Seng", value: "24.917,60", change: 0.45 },
  { symbol: "Kospi", value: "6.684,37", change: -3.26 },
];

export const MarketTicker: React.FC = () => {
  return (
    <div className="bg-slate-950 border-b border-slate-800 flex items-center overflow-hidden h-9 text-xs">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="flex bg-indigo-500/10 text-indigo-300 font-bold px-3 py-2 items-center border-r border-slate-800 z-10 h-full shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
        MERCADOS
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="animate-ticker">
          {/* Double the list to create a seamless infinite loop */}
          {[...marketData, ...marketData].map((item, index) => {
            const isPositive = item.change >= 0;
            return (
              <div key={index} className="flex items-center space-x-2 px-6 border-r border-slate-800/50 whitespace-nowrap">
                <span className="font-medium text-slate-300">{item.symbol}</span>
                <span className="text-slate-100">{item.value}</span>
                <span className={`flex items-center font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? '+' : ''}{item.change.toFixed(2).replace('.', ',')}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
