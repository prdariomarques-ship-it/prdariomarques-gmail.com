import React, { useState } from 'react';
import { Portfolio, BarbellAllocation } from '../types';
import { TabKey } from './Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { mapAssetToBarbellBlock } from '../utils/barbellMapper';
import {
  Dumbbell, 
  Info, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Activity, 
  Globe, 
  ArrowRight,
  Target
} from 'lucide-react';

interface BarbellStrategyViewProps {
  portfolios: Portfolio[];
  onNavigateTab: (tab: TabKey) => void;
  onSelectPortfolio: (id: string) => void;
}


const MODERATE_BARBELL: BarbellAllocation = {
  profile: 'Moderado',
  blocks: [
    {
      id: 'ponta1',
      name: 'Ponta 1 — Curto Prazo',
      description: 'Proteção e liquidez. Menor volatilidade, flexibilidade. Preserva capital, gera liquidez, permite aproveitar oportunidades.',
      targetTotalPercent: 35,
      subAllocations: [
        { name: 'Tesouro Selic / CDI (0-2 anos)', targetPercent: 20 },
        { name: 'CDBs e fundos DI (alta qualidade)', targetPercent: 10 },
        { name: 'Crédito privado curto (1-3 anos, alta qualidade)', targetPercent: 5 },
      ]
    },
    {
      id: 'miolo',
      name: 'Miolo da Curva',
      description: 'Renda fixa intermediária (exige seletividade). Risco de duration, crédito, liquidez e risco Brasil. Só usar com tese clara.',
      targetTotalPercent: 15,
      subAllocations: [
        { name: 'Crédito privado médio (3-5 anos)', targetPercent: 5 },
        { name: 'Prefixados intermediários (3-7 anos)', targetPercent: 5 },
        { name: 'NTN-B intermediária (4-8 anos)', targetPercent: 5 },
      ]
    },
    {
      id: 'ponta2',
      name: 'Ponta 2 — Longo Prazo',
      description: 'Duration e proteção. Maior volatilidade, maior potencial. Captura prêmio de prazo, protege contra choques.',
      targetTotalPercent: 20,
      subAllocations: [
        { name: 'NTN-B longa (8-20+ anos)', targetPercent: 10 },
        { name: 'Prefixado longo (>7 anos)', targetPercent: 5 },
        { name: 'Fundos de inflação / ativos reais', targetPercent: 5 },
      ]
    },
    {
      id: 'acoes',
      name: 'Ações (Crescimento)',
      description: 'Busca retornos desproporcionais e crescimento de capital no longo prazo.',
      targetTotalPercent: 20,
      subAllocations: [
        { name: 'Bolsa Brasil', targetPercent: 10 },
        { name: 'Ações internacionais (via ETFs ou BDRs)', targetPercent: 10 },
      ]
    },
    {
      id: 'alternativos',
      name: 'Ativos Alternativos',
      description: 'Proteção de cauda e diversificação geográfica/cambial.',
      targetTotalPercent: 10,
      subAllocations: [
        { name: 'Dólar (via BDRs/ETFs)', targetPercent: 5 },
        { name: 'Ouro (via ETF ou físico)', targetPercent: 3 },
        { name: 'Commodities / REITs / Bitcoin (opcional)', targetPercent: 2 },
      ]
    }
  ]
};




const EMPTY_BARBELL = (profileName: string): BarbellAllocation => ({
  profile: profileName,
  blocks: [
    {
      id: 'ponta1',
      name: 'Ponta 1 — Curto Prazo',
      description: 'Proteção e liquidez. Menor volatilidade, flexibilidade. Preserva capital, gera liquidez, permite aproveitar oportunidades.',
      targetTotalPercent: 0,
      subAllocations: [{ name: 'PENDENTE — Dário vai definir os números pra esse perfil', targetPercent: 0 }]
    },
    {
      id: 'miolo',
      name: 'Miolo da Curva',
      description: 'Renda fixa intermediária (exige seletividade). Risco de duration, crédito, liquidez e risco Brasil. Só usar com tese clara.',
      targetTotalPercent: 0,
      subAllocations: [{ name: 'PENDENTE — Dário vai definir os números pra esse perfil', targetPercent: 0 }]
    },
    {
      id: 'ponta2',
      name: 'Ponta 2 — Longo Prazo',
      description: 'Duration e proteção. Maior volatilidade, maior potencial. Captura prêmio de prazo, protege contra choques.',
      targetTotalPercent: 0,
      subAllocations: [{ name: 'PENDENTE — Dário vai definir os números pra esse perfil', targetPercent: 0 }]
    },
    {
      id: 'acoes',
      name: 'Ações (Crescimento)',
      description: 'Busca retornos desproporcionais e crescimento de capital no longo prazo.',
      targetTotalPercent: 0,
      subAllocations: [{ name: 'PENDENTE — Dário vai definir os números pra esse perfil', targetPercent: 0 }]
    },
    {
      id: 'alternativos',
      name: 'Ativos Alternativos',
      description: 'Proteção de cauda e diversificação geográfica/cambial.',
      targetTotalPercent: 0,
      subAllocations: [{ name: 'PENDENTE — Dário vai definir os números pra esse perfil', targetPercent: 0 }]
    }
  ]
});








const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm z-50">
        <h4 className="font-bold text-white text-sm mb-2">{data.fullName}</h4>
        
        <div className="flex gap-6 mb-3 pb-3 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Alocação Atual</span>
            <span className="text-indigo-400 font-mono font-bold text-sm">{data.Atual}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Estratégia Alvo</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">{data.Alvo}%</span>
          </div>
        </div>
        
        {data.assets && data.assets.length > 0 ? (
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Composição Atual & Lógica de Mapeamento
            </span>
            <ul className="space-y-3">
              {data.assets.map((asset: any, idx: number) => (
                <li key={idx} className="text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-slate-200 font-medium truncate pr-2">{asset.name}</span>
                    <span className="text-slate-400 font-mono font-semibold whitespace-nowrap">{asset.allocationPercent.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      <span className="text-indigo-400/80 font-medium mr-1">Racional:</span>
                      {asset.mappingReason}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic mt-2">Nenhum ativo alocado neste bloco.</p>
        )}
      </div>
    );
  }
  return null;
};



const CONSERVATIVE_BARBELL: BarbellAllocation = {
  profile: 'Conservador',
  blocks: [
    {
      id: 'ponta1',
      name: 'Ponta 1 — Curto Prazo',
      description: 'Proteção e liquidez absoluta. Preserva capital, defende contra qualquer solavanco e permite resgates emergenciais sem perda de marcação.',
      targetTotalPercent: 65,
      subAllocations: [
        { name: 'Tesouro Selic / CDI', targetPercent: 40 },
        { name: 'CDBs e fundos DI (alta qualidade)', targetPercent: 15 },
        { name: 'Crédito privado curto (1-3 anos)', targetPercent: 10 }
      ]
    },
    {
      id: 'miolo',
      name: 'Miolo da Curva',
      description: 'Exposição cirúrgica e minúscula apenas para leve ganho real acima da inflação em janelas travadas.',
      targetTotalPercent: 10,
      subAllocations: [
        { name: 'Crédito privado médio (3-5 anos)', targetPercent: 5 },
        { name: 'NTN-B intermediária (4-8 anos)', targetPercent: 5 }
      ]
    },
    {
      id: 'ponta2',
      name: 'Ponta 2 — Longo Prazo',
      description: 'Assimetria focada na proteção do poder de compra no longo prazo contra a inflação brasileira estrutural.',
      targetTotalPercent: 15,
      subAllocations: [
        { name: 'NTN-B longa (8-20+ anos)', targetPercent: 10 },
        { name: 'Fundos de inflação / ativos reais', targetPercent: 5 }
      ]
    },
    {
      id: 'acoes',
      name: 'Ações',
      description: 'Uma gota de pimenta para participar marginalmente do crescimento econômico corporativo global.',
      targetTotalPercent: 5,
      subAllocations: [
        { name: 'Bolsa Brasil', targetPercent: 2.5 },
        { name: 'Ações internacionais', targetPercent: 2.5 }
      ]
    },
    {
      id: 'alternativos',
      name: 'Ativos Alternativos',
      description: 'Proteção cambial e reserva de valor global em caso de estresse agudo local.',
      targetTotalPercent: 5,
      subAllocations: [
        { name: 'Dólar (via BDRs/ETFs)', targetPercent: 3 },
        { name: 'Ouro (via ETF ou físico)', targetPercent: 2 }
      ]
    }
  ]
};

const BOLD_BARBELL: BarbellAllocation = {
  profile: 'Arrojado',
  blocks: [
    {
      id: 'ponta1',
      name: 'Ponta 1 — Curto Prazo',
      description: 'Apenas a munição necessária para cobrir despesas de curto prazo e ter "pólvora seca" para aproveitar grandes quedas direcionais.',
      targetTotalPercent: 20,
      subAllocations: [
        { name: 'Tesouro Selic / CDI', targetPercent: 10 },
        { name: 'CDBs e fundos DI', targetPercent: 10 }
      ]
    },
    {
      id: 'miolo',
      name: 'Miolo da Curva',
      description: 'Praticamente zerado. Risco direcional moderado não justifica o retorno quando o prêmio das pontas é muito superior.',
      targetTotalPercent: 5,
      subAllocations: [
        { name: 'Crédito Privado Premium ou NTN-B curta', targetPercent: 5 }
      ]
    },
    {
      id: 'ponta2',
      name: 'Ponta 2 — Longo Prazo',
      description: 'Dose alta de convexidade pura via juros reais longos e nominais buscando valorização aguda de marcação a mercado.',
      targetTotalPercent: 25,
      subAllocations: [
        { name: 'NTN-B longa (8-20+ anos)', targetPercent: 15 },
        { name: 'Prefixado longo (>7 anos)', targetPercent: 10 }
      ]
    },
    {
      id: 'acoes',
      name: 'Ações',
      description: 'O motor de crescimento real da carteira. Foco em participar das grandes valorizações corporativas em ciclos de expansão.',
      targetTotalPercent: 35,
      subAllocations: [
        { name: 'Bolsa Brasil', targetPercent: 15 },
        { name: 'Ações internacionais', targetPercent: 20 }
      ]
    },
    {
      id: 'alternativos',
      name: 'Ativos Alternativos',
      description: 'Rede de segurança fundamental contra a alta volatilidade inserida na Ponta 2 e em Ações. Dólar é rei.',
      targetTotalPercent: 15,
      subAllocations: [
        { name: 'Dólar (via BDRs/ETFs)', targetPercent: 7 },
        { name: 'Ouro (via ETF ou físico)', targetPercent: 5 },
        { name: 'Commodities / Criptoativos', targetPercent: 3 }
      ]
    }
  ]
};

const AGGRESSIVE_BARBELL: BarbellAllocation = {
  profile: 'Agressivo',
  blocks: [
    {
      id: 'ponta1',
      name: 'Ponta 1 — Curto Prazo',
      description: 'Caixa de guerra puro. Sem função de rentabilidade, servindo apenas para caixa de oportunidade aguda.',
      targetTotalPercent: 10,
      subAllocations: [
        { name: 'Tesouro Selic / CDI', targetPercent: 10 }
      ]
    },
    {
      id: 'miolo',
      name: 'Miolo da Curva',
      description: 'O Miolo é uma distração para quem busca assimetria agressiva. Retorno travado com risco de crédito desnecessário. Totalmente zerado.',
      targetTotalPercent: 0,
      subAllocations: []
    },
    {
      id: 'ponta2',
      name: 'Ponta 2 — Longo Prazo',
      description: 'Postura fortemente direcional apostando no ciclo de juros.',
      targetTotalPercent: 30,
      subAllocations: [
        { name: 'NTN-B muito longa', targetPercent: 15 },
        { name: 'Prefixados muito longos', targetPercent: 15 }
      ]
    },
    {
      id: 'acoes',
      name: 'Ações',
      description: 'O coração direcional da carteira, maximizando a exposição a crescimento e teses estruturais de tecnologia e valor.',
      targetTotalPercent: 40,
      subAllocations: [
        { name: 'Bolsa Brasil', targetPercent: 15 },
        { name: 'Ações Internacionais / Teses Growth', targetPercent: 25 }
      ]
    },
    {
      id: 'alternativos',
      name: 'Ativos Alternativos',
      description: 'Hedge cambial forte para neutralizar o risco-país extremo assumido nas outras pontas.',
      targetTotalPercent: 20,
      subAllocations: [
        { name: 'Dólar (via BDRs/ETFs)', targetPercent: 15 },
        { name: 'Ouro (via ETF ou físico)', targetPercent: 2 },
        { name: 'Criptoativos', targetPercent: 3 }
      ]
    }
  ]
};

const getBarbellForProfile = (profile: string): BarbellAllocation => {
  if (profile === 'Conservador') return CONSERVATIVE_BARBELL;
  if (profile === 'Moderado') return MODERATE_BARBELL;
  if (profile === 'Arrojado') return BOLD_BARBELL;
  if (profile === 'Agressivo') return AGGRESSIVE_BARBELL;
  return CONSERVATIVE_BARBELL; // fallback
};

export const BarbellStrategyView: React.FC<BarbellStrategyViewProps> = ({ portfolios, onNavigateTab, onSelectPortfolio }) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(portfolios[0]?.id || '');
  
  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolioId) || portfolios[0];
  
  // Mapeamento aproximado da carteira atual para blocos do Barbell
  // Na vida real isso seria feito analisando os ativos um a um por prazo/tipo

  // Função para mapear ativos reais para blocos Barbell
  const getMappedAssets = (portfolio: Portfolio | undefined) => {
    const result = {
      totals: { ponta1: 0, miolo: 0, ponta2: 0, acoes: 0, alternativos: 0 },
      assets: { ponta1: [] as any[], miolo: [] as any[], ponta2: [] as any[], acoes: [] as any[], alternativos: [] as any[] },
      naoClassificado: [] as any[]
    };
    
    if (!portfolio) return result;
    
    if (portfolio.cashBalance > 0) {
      const cashPercent = (portfolio.cashBalance / portfolio.totalAum) * 100;
      result.totals['ponta1'] += cashPercent;
      result.assets['ponta1'].push({
        name: 'Saldo em Conta (Caixa)',
        allocationPercent: cashPercent,
        mappingReason: 'Caixa e equivalentes são alocados na Ponta 1 por terem liquidez imediata e risco zero de mercado.'
      });
    }

    portfolio.assets.forEach(asset => {
      const mapping = mapAssetToBarbellBlock(asset);
      if (mapping.blockId !== 'Não classificado') {
        // @ts-ignore
        result.totals[mapping.blockId] += asset.allocationPercent;
        // @ts-ignore
        result.assets[mapping.blockId].push({ ...asset, mappingReason: mapping.reason });
      } else {
        result.naoClassificado.push({ ...asset, mappingReason: mapping.reason });
      }
    });

    return result;
  };

  const mappedData = getMappedAssets(currentPortfolio);

  const activeBarbell = getBarbellForProfile(currentPortfolio.profile);

  const chartData = activeBarbell.blocks.map(block => {
    // @ts-ignore
    const actual = (mappedData.totals as any)[block.id] || 0;
    return {
      name: block.name.split(' — ')[0], // short name
      fullName: block.name,
      Alvo: block.targetTotalPercent,
      Atual: parseFloat(actual.toFixed(1)),
      // @ts-ignore
      assets: (mappedData.assets as any)[block.id] || []
    };
  });


  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Dumbbell className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Estratégia Barbell</h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed mb-4">
            Duas pontas, um propósito. O miolo, com parcimônia. <br/>
            Módulo de recomendação estrutural. Esta é uma alocação-alvo referencial para 
            comparar com a carteira do cliente. Diferente dos <span className="text-slate-300 font-mono text-xs">mandateLimits</span>, estas 
            são diretrizes flexíveis de longo prazo.
          </p>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 inline-flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-300 italic">
              "O Barbell não é sobre prever o futuro. É sobre estar preparado para diferentes futuros."
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto relative z-10 flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Comparar com Carteira
          </label>
          <div className="relative">
            <select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className="w-full sm:w-64 appearance-none bg-slate-950 border border-slate-700 text-white text-sm rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.profile})
                </option>
              ))}
            </select>
            <ArrowRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>


      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Análise de Gap: Atual vs Alvo</h2>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <RechartsTooltip 
                cursor={{ fill: '#334155', opacity: 0.4 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="Atual" fill="#818cf8" radius={[4, 4, 0, 0]} name="Carteira Atual (%)" />
              <Bar dataKey="Alvo" fill="#34d399" radius={[4, 4, 0, 0]} name="Estratégia Alvo (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.3)]" />
            <span className="text-sm text-slate-300 font-medium">Alocação Atual</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
            <span className="text-sm text-slate-300 font-medium">Alocação-Alvo Barbell</span>
          </div>
        </div>
      </div>

      {/* Strategy Grid */}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeBarbell.blocks.map((block) => {
          
          
          let Icon = ShieldCheck;
          let theme = {
            bgGlow: 'bg-emerald-500/5 group-hover:bg-emerald-500/10',
            iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            bar: 'bg-emerald-400',
            borderTop: 'border-t-emerald-500'
          };
          
          if (block.id === 'miolo') { 
            Icon = Activity; 
            theme = { bgGlow: 'bg-rose-500/5 group-hover:bg-rose-500/10', iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', bar: 'bg-rose-400', borderTop: 'border-t-rose-500' };
          }
          if (block.id === 'ponta2') { 
            Icon = TrendingUp; 
            theme = { bgGlow: 'bg-sky-500/5 group-hover:bg-sky-500/10', iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', bar: 'bg-sky-400', borderTop: 'border-t-sky-500' };
          }
          if (block.id === 'acoes') { 
            Icon = Target; 
            theme = { bgGlow: 'bg-amber-500/5 group-hover:bg-amber-500/10', iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', bar: 'bg-amber-400', borderTop: 'border-t-amber-500' };
          }
          if (block.id === 'alternativos') { 
            Icon = Globe; 
            theme = { bgGlow: 'bg-purple-500/5 group-hover:bg-purple-500/10', iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', bar: 'bg-purple-400', borderTop: 'border-t-purple-500' };
          }

          // @ts-ignore
          const actualVal = mappedData.totals[block.id] || 0;
          const dev = actualVal - block.targetTotalPercent;
          const isDeviated = Math.abs(dev) > 5;

          return (
            <div key={block.id} className={`bg-slate-900 border border-slate-800 border-t-4 ${theme.borderTop} rounded-2xl flex flex-col overflow-hidden group hover:border-slate-700 transition-colors`}>
              <div className="p-5 border-b border-slate-800/80 bg-slate-900/50 flex flex-col gap-3 relative overflow-hidden">
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${theme.bgGlow}`} />
                
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg border ${theme.iconBg}`}>

                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-white text-sm">{block.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-white tracking-tight">
                      {block.targetTotalPercent}%
                    </span>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Alocação Alvo
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed z-10">
                  {block.description}
                </p>
              </div>

              {/* Sub-allocations */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Composição Sugerida
                </div>
                {block.subAllocations.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm group/item">
                    <span className="text-slate-300 text-xs truncate pr-2 group-hover/item:text-white transition-colors">
                      {sub.name}
                    </span>
                    <span className="font-mono text-slate-400 text-xs font-semibold whitespace-nowrap">
                      {sub.targetPercent}%
                    </span>
                  </div>
                ))}
              </div>


              {/* Comparison Footer */}
              {currentPortfolio && (
                <div className="p-4 bg-slate-950/50 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Na Carteira Atual
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isDeviated 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {dev > 0 ? '+' : ''}{dev.toFixed(1)} p.p.
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-lg font-bold text-white font-mono">
                      {actualVal.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500 pb-1">alocado</span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full mb-4 overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isDeviated && dev < 0 ? 'bg-amber-400' : isDeviated && dev > 0 ? 'bg-rose-400' : theme.bar
                      }`}
                      style={{ width: `${Math.min(100, (actualVal / block.targetTotalPercent) * 100)}%` }}
                    />
                  </div>

                  {/* Mapped Real Assets with Tooltip */}
                  {(mappedData.assets as any)[block.id]?.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Ativos Mapeados (Real)
                      </div>
                      {(mappedData.assets as any)[block.id].map((asset: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs group/asset relative cursor-help">
                          <span className="text-slate-400 truncate pr-2 border-b border-dashed border-slate-700 group-hover/asset:border-indigo-400 group-hover/asset:text-slate-200 transition-colors">
                            {asset.name}
                          </span>
                          <span className="font-mono text-slate-500 whitespace-nowrap">
                            {asset.allocationPercent.toFixed(1)}%
                          </span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] leading-relaxed rounded shadow-xl opacity-0 invisible group-hover/asset:opacity-100 group-hover/asset:visible transition-all z-20 pointer-events-none">
                            <span className="font-semibold block mb-1 text-indigo-400">Lógica de Mapeamento:</span>
                            {asset.mappingReason}
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-slate-700"></div>
                            <div className="absolute top-full left-4 -mt-0.5 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Static Proprietary Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 pt-12 border-t border-slate-800">
        
        {/* Scenarios */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Como cada cenário pode impactar</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Cenário positivo
              </h3>
              <p className="text-xs text-slate-400 mb-4 italic">(ajuste fiscal, inflação cai, juros caem, curva fecha)</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-500 mt-0.5">•</span> Ponta longa valoriza (NTN-B e prefixados)
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-500 mt-0.5">•</span> Bolsa tende a subir
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-500 mt-0.5">•</span> Crédito melhora
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-500 mt-0.5">•</span> CDI ainda entrega bom carrego durante a transição
                </li>
              </ul>
            </div>

            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Cenário negativo
              </h3>
              <p className="text-xs text-slate-400 mb-4 italic">(deterioração fiscal, juros sobem, inflação piora, risco Brasil aumenta)</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-rose-500 mt-0.5">•</span> Ponta curta protege (CDI/Selic)
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-rose-500 mt-0.5">•</span> Dólar, ouro e exterior funcionam como hedge
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-rose-500 mt-0.5">•</span> Bolsa pode cair, mas diversificação internacional ajuda
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-rose-500 mt-0.5">•</span> Miolo da curva tende a sofrer mais (marcação a mercado e crédito)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Principles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Princípios e Lembretes</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider">Princípios</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Duas pontas com funções diferentes: proteção e assimetria.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Miolo com parcimônia e seletividade.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Diversificação geográfica e cambial.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Foco no horizonte de longo prazo.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Ajuste a alocação conforme o cenário e o perfil de risco do cliente.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-500 mt-0.5">•</span> Mais importante que o produto é o risco que está sendo carregado.
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider">Lembretes</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-500 mt-0.5">•</span> Barbell não é sobre acertar o futuro.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-500 mt-0.5">•</span> É sobre resistir aos cenários adversos e capturar oportunidades quando elas aparecem.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-500 mt-0.5">•</span> Renda fixa não é tudo igual: analise duration, crédito e moeda.
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-500 mt-0.5">•</span> Disciplina é o que faz a estratégia funcionar.
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">
              "Menos adivinhação. Mais preparação."
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
