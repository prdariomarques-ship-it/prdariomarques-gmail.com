const fs = require('fs');
let code = fs.readFileSync('src/components/PortfoliosView.tsx', 'utf-8');
code = code.replace("import {", "import {\n  ChevronDown,\n  ChevronUp,\n  TrendingUp,\n");
fs.writeFileSync('src/components/PortfoliosView.tsx', code);
