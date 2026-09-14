const fs = require('fs');
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  inAppAudio: boolean;
  updatedAt?: string;`;

const replacement = `  inAppAudio: boolean;
  logRetentionDays?: number;
  updatedAt?: string;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find target block in types.ts");
}
