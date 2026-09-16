const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // replace "from './something'" with "from './something.ts'"
      content = content.replace(/from '(\.[^']*)'/g, (match, p1) => {
        if (!p1.endsWith('.ts') && !p1.endsWith('.json')) {
          return `from '${p1}.ts'`;
        }
        return match;
      });
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('./src/server');
