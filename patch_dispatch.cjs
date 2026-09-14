const fs = require('fs');
const file = 'src/server/notificationChannelsRepo.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  for (const alert of alerts) {
    if (settings.email.enabled && (!settings.email.sendOnCriticalOnly || alert.severity === 'CRITICAL')) {
      const maskedDest = maskEmail(settings.email.recipient);
      const emailLog: SecondaryDispatchLog = {`;

const replacement = `  for (const alert of alerts) {
    const severitiesFilter = settings.email.severitiesFilter || ['CRITICAL', 'WARNING', 'NORMAL'];
    const assetClassesFilter = settings.email.assetClassesFilter || ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'];
    
    // Evaluate filters
    let passesFilter = true;
    if (settings.email.sendOnCriticalOnly) {
      if (alert.severity !== 'CRITICAL') passesFilter = false;
    } else {
      if (!severitiesFilter.includes(alert.severity)) passesFilter = false;
      if (!assetClassesFilter.includes(alert.assetClass)) passesFilter = false;
    }

    if (settings.email.enabled && passesFilter) {
      const maskedDest = maskEmail(settings.email.recipient);
      const emailLog: SecondaryDispatchLog = {`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
