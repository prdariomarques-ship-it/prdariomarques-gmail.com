const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('PWAInstallButton')) {
  code = code.replace(
    "import { MarketTicker } from './components/common/MarketTicker';",
    "import { MarketTicker } from './components/common/MarketTicker';\nimport { PWAInstallButton } from './components/PWAInstallButton';"
  );

  code = code.replace(
    "<ConnectivityLatencyBadge />",
    "<ConnectivityLatencyBadge />\n            <span className=\"hidden sm:inline-block\"><PWAInstallButton /></span>"
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx patched');
}
