import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `import { BarbellStrategyView } from './components/BarbellStrategyView';`;
const importReplacement = `import { BarbellStrategyView } from './components/BarbellStrategyView';
import { CorrelationMatrixView } from './components/CorrelationMatrixView';`;
content = content.replace(importTarget, importReplacement);

const renderTarget = `{activeTab === 'barbell' && (`;
const renderReplacement = `{activeTab === 'correlation' && (
            <CorrelationMatrixView
              portfolios={effectivePortfolios}
              alerts={effectiveAlerts}
            />
          )}
          {activeTab === 'barbell' && (`;
content = content.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/App.tsx', content);
