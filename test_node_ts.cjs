const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/from '\.\/src\/server\/portfolioRepo'/g, "from './src/server/portfolioRepo.ts'");
code = code.replace(/from '\.\/src\/server\/notificationChannelsRepo'/g, "from './src/server/notificationChannelsRepo.ts'");
code = code.replace(/from '\.\/src\/server\/complianceAgent'/g, "from './src/server/complianceAgent.ts'");
code = code.replace(/from '\.\/src\/server\/geminiService'/g, "from './src/server/geminiService.ts'");
code = code.replace(/from '\.\/src\/types'/g, "from './src/types.ts'");
fs.writeFileSync('server.ts', code);
