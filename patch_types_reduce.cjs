const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    filteredLogs.reduce((acc, log) => {
                      const dateStr = log.sentAt.split(' ')[0] || 'Data Desconhecida';
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(log);
                      return acc;
                    }, {})`;

const replacement = `                    filteredLogs.reduce((acc, log) => {
                      const dateStr = log.sentAt.split(' ')[0] || 'Data Desconhecida';
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(log);
                      return acc;
                    }, {} as Record<string, typeof filteredLogs>)`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find target");
}
