const fs = require('fs');
let code = fs.readFileSync('src/components/common/ComplianceAlertCard.tsx', 'utf-8');

code = code.replace(
  'Contexto de Mercado (Atribuição de Performance)', 
  'Desvio Passivo de Mercado (vs. Operação Manual)'
);

code = code.replace(
  '<Sparkles className="w-4 h-4 text-emerald-400" />',
  '<TrendingUp className="w-4 h-4 text-emerald-400" />'
);

code = code.replace(
  'import { ShieldAlert, AlertTriangle, ArrowRight, Activity, Zap, CheckCircle2, Bot, Scale, BookOpen, AlertCircle, Building, Info, FileText, Sparkles }',
  'import { ShieldAlert, AlertTriangle, ArrowRight, Activity, Zap, CheckCircle2, Bot, Scale, BookOpen, AlertCircle, Building, Info, FileText, Sparkles, TrendingUp }'
);

fs.writeFileSync('src/components/common/ComplianceAlertCard.tsx', code);
console.log('UI patched');
