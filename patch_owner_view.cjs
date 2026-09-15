const fs = require('fs');
let code = fs.readFileSync('src/components/OwnerCommandCenterView.tsx', 'utf-8');

// Add import
code = code.replace(
  "import { MiniSparkline } from './MiniSparkline';",
  "import { MiniSparkline } from './MiniSparkline';\nimport { exportElementToPDF } from '../utils/pdfExport';"
);

// Add id to main wrapper
code = code.replace(
  '<div className="space-y-6">',
  '<div id="owner-dashboard-content" className="space-y-6">'
);

// Add PDF Export button next to period selectors
code = code.replace(
  "            <div className=\"flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]\">",
  "            <button\n              onClick={() => exportElementToPDF('owner-dashboard-content', 'Executive-Report', 'Relatório Executivo')}\n              className=\"px-3 py-1.5 flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition border border-indigo-500/50 shadow-sm mr-2\"\n            >\n              <Download className=\"w-3.5 h-3.5\" />\n              <span>Exportar PDF</span>\n            </button>\n\n            <div className=\"flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]\">"
);

fs.writeFileSync('src/components/OwnerCommandCenterView.tsx', code);
console.log('patched OwnerCommandCenterView.tsx');
