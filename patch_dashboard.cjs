const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf-8');

// Add import
code = code.replace(
  "import { PortfolioSectorRiskHeatmap } from './PortfolioSectorRiskHeatmap';",
  "import { PortfolioSectorRiskHeatmap } from './PortfolioSectorRiskHeatmap';\nimport { GlobalAssetDistributionChart } from './GlobalAssetDistributionChart';"
);

// Add the component
const target = `      {/* ÍNDICE DE LIQUIDEZ IMEDIATA DO PORTFÓLIO CONSOLIDADO (D+0 VS. D+1 OU SUPERIOR) */}
      <ImmediateLiquidityIndexCard
        portfolios={portfolios}
        onSelectPortfolio={onSelectPortfolio}
        onStartRebalance={onStartRebalance}
      />`;

const replacement = `      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlobalAssetDistributionChart portfolios={portfolios} alerts={alerts} />
        <ImmediateLiquidityIndexCard
          portfolios={portfolios}
          onSelectPortfolio={onSelectPortfolio}
          onStartRebalance={onStartRebalance}
        />
      </div>`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/DashboardView.tsx', code);
    console.log('patched DashboardView');
} else {
    console.log('failed to find target in DashboardView');
}
