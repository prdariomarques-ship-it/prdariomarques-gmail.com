const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

code = code.replace(
  "import App from './App.tsx';",
  "import App from './App.tsx';\nimport { AuthProvider } from './components/AuthProvider';"
);

code = code.replace(
  "<App />",
  "<AuthProvider>\n      <App />\n    </AuthProvider>"
);

fs.writeFileSync('src/main.tsx', code);
console.log('patched main.tsx');
