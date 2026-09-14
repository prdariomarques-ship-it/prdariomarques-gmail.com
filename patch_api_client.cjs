const fs = require('fs');
const file = 'src/lib/apiClient.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/declare const __FLOWCORE_RUNTIME_TOKEN__: string \| undefined;/g, '');
content = content.replace(/function resolveDefaultToken\(\)[\s\S]*?export const DEFAULT_DEV_TOKEN = resolveDefaultToken\(\);/g, "export const DEFAULT_DEV_TOKEN = '';");

fs.writeFileSync(file, content);
console.log("Success api client patch");
