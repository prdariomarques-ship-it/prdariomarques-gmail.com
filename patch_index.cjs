const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf-8');

const headEnd = '</head>';
const insertStr = `
    <meta name="theme-color" content="#020617" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Compliance" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
`;

code = code.replace(headEnd, insertStr + headEnd);
fs.writeFileSync('index.html', code);
console.log('patched index.html');
