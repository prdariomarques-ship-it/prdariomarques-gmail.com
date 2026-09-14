const fs = require('fs');
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  assetTolerances?: Partial<Record<AssetClass, number>>;
}`;

const replacement = `  assetTolerances?: Partial<Record<AssetClass, number>>;
  customSubjectTemplate?: string;
  customBodyTemplate?: string;
}`;

if (!content.includes(target)) {
  console.log("Could not find target block");
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
}
