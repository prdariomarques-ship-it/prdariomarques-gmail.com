const fs = require('fs');
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  scheduledReportTime?: string;
  scheduledReportCron?: string;`;

const replacement = `  scheduledReportTime?: string;
  scheduledReportDayOfWeek?: string;
  scheduledReportCron?: string;`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
