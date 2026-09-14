const fs = require('fs');
const file = 'src/server/notificationChannelsRepo.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    if (settings.email.enabled && passesFilter) {
      const maskedDest = maskEmail(settings.email.recipient);
      const emailLog: SecondaryDispatchLog = {
        id: \`disp-email-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
        channel: 'EMAIL',
        recipient: maskedDest,
        status: 'SENT',
        subjectOrTitle: \`[FlowCore URGENTE] \${alert.portfolioName} - Desenquadramento em \${alert.assetClass}\`,
        bodyPreview: \`Alerta Crítico: \${alert.message}. Alocação atual: \${alert.currentPercent.toFixed(
          1
        )}% (Teto \${alert.maxPercent.toFixed(1)}%). Excesso financeiro apurado: R$ \${alert.excessValueBRL.toLocaleString(
          'pt-BR'
        )}. Recomendação: \${alert.suggestedAction}.\`,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
      };`;

const replacement = `    if (settings.email.enabled && passesFilter) {
      const maskedDest = maskEmail(settings.email.recipient);
      
      let subject = \`[FlowCore URGENTE] \${alert.portfolioName} - Desenquadramento em \${alert.assetClass}\`;
      if (settings.email.customSubjectTemplate) {
        subject = settings.email.customSubjectTemplate
          .replace(/\\{\\{portfolioName\\}\\}/g, alert.portfolioName)
          .replace(/\\{\\{severity\\}\\}/g, alert.severity)
          .replace(/\\{\\{assetClass\\}\\}/g, alert.assetClass);
      }

      let body = \`Alerta Crítico: \${alert.message}. Alocação atual: \${alert.currentPercent.toFixed(1)}% (Teto \${alert.maxPercent.toFixed(1)}%). Excesso financeiro apurado: R$ \${alert.excessValueBRL.toLocaleString('pt-BR')}. Recomendação: \${alert.suggestedAction}.\`;
      if (settings.email.customBodyTemplate) {
        body = settings.email.customBodyTemplate
          .replace(/\\{\\{portfolioName\\}\\}/g, alert.portfolioName)
          .replace(/\\{\\{severity\\}\\}/g, alert.severity)
          .replace(/\\{\\{assetClass\\}\\}/g, alert.assetClass)
          .replace(/\\{\\{message\\}\\}/g, alert.message)
          .replace(/\\{\\{currentPercent\\}\\}/g, alert.currentPercent.toFixed(1))
          .replace(/\\{\\{maxPercent\\}\\}/g, alert.maxPercent.toFixed(1))
          .replace(/\\{\\{excessValueBRL\\}\\}/g, alert.excessValueBRL.toLocaleString('pt-BR'));
      }

      const emailLog: SecondaryDispatchLog = {
        id: \`disp-email-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
        channel: 'EMAIL',
        recipient: maskedDest,
        status: 'SENT',
        subjectOrTitle: subject,
        bodyPreview: body,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
      };`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
