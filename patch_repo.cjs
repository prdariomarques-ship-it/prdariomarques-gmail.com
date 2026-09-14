const fs = require('fs');
const file = 'src/server/notificationChannelsRepo.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    let passesFilter = true;
    if (settings.email.sendOnCriticalOnly) {
      if (alert.severity !== 'CRITICAL') passesFilter = false;
    } else {
      if (!severitiesFilter.includes(alert.severity)) passesFilter = false;
      if (!assetClassesFilter.includes(alert.assetClass)) passesFilter = false;
    }

    if (settings.email.enabled && passesFilter) {`;

const replacement = `    let passesFilter = true;
    if (settings.email.sendOnCriticalOnly) {
      if (alert.severity !== 'CRITICAL') passesFilter = false;
    } else {
      if (!severitiesFilter.includes(alert.severity)) passesFilter = false;
      if (!assetClassesFilter.includes(alert.assetClass)) passesFilter = false;
      
      if (passesFilter) {
        // Tolerância em pontos percentuais (p.p.)
        const tolerance = settings.email.assetTolerances?.[alert.assetClass] ?? 0;
        if (tolerance > 0 && Math.abs(alert.deviationPP) <= tolerance) {
          passesFilter = false;
        }
      }
    }

    if (settings.email.enabled && passesFilter) {`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
