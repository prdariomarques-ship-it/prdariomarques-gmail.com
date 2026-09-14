const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<span className="text-[10px] text-slate-500">Aceita: {{portfolioName}}, {{severity}}, {{assetClass}}, {{message}}, {{currentPercent}}, {{maxPercent}}, {{excessValueBRL}}</span>`;

const replacement = `<span className="text-[10px] text-slate-500">Aceita: {'{{portfolioName}}'}, {'{{severity}}'}, {'{{assetClass}}'}, {'{{message}}'}, {'{{currentPercent}}'}, {'{{maxPercent}}'}, {'{{excessValueBRL}}'}</span>`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
