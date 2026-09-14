import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Replace dev block
content = content.replace(
  /const sessionToken = mintSession\(res\);\s*const indexPath = path\.join\(process\.cwd\(\), 'index\.html'\);\s*let template = fs\.readFileSync\(indexPath, 'utf-8'\);\s*template = await vite\.transformIndexHtml\(url, template\);\s*const tokenScript = `<script>window\.__FLOWCORE_INITIAL_TOKEN__ = \$\{JSON\.stringify\(sessionToken\)\};<\/script>`;\s*template = template\.replace\('<\/head>', `\$\{tokenScript\}<\/head>`\);/,
  `const indexPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);`
);

// Replace prod block
content = content.replace(
  /const sessionToken = mintSession\(res\);\s*const indexPath = path\.join\(distPath, 'index\.html'\);\s*let html = fs\.readFileSync\(indexPath, 'utf-8'\);\s*const tokenScript = `<script>window\.__FLOWCORE_INITIAL_TOKEN__ = \$\{JSON\.stringify\(sessionToken\)\};<\/script>`;\s*html = html\.replace\('<\/head>', `\$\{tokenScript\}<\/head>`\);/,
  `const indexPath = path.join(distPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');`
);

fs.writeFileSync('server.ts', content);
console.log('Removed mintSession injections!');
