const fs = require('fs');
const content = fs.readFileSync('src/components/Header.tsx', 'utf8');
const target = `            Estratégia Barbell
          </button>`;
const replacement = `            Estratégia Barbell
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={\`flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap \${
              activeTab === 'correlation'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }\`}
          >
            <Layers className="w-4 h-4 mr-2" />
            Matriz de Correlação
          </button>`;
fs.writeFileSync('src/components/Header.tsx', content.replace(target, replacement));
