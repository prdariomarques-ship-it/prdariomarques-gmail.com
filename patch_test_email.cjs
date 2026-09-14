const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetState = `  const [testingChannel, setTestingChannel] = useState<'EMAIL' | 'SMS' | 'ALL' | null>(null);`;
const replacementState = `  const [testingChannel, setTestingChannel] = useState<'EMAIL' | 'SMS' | 'ALL' | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');`;

const targetUI = `                        <button
                          onClick={() => handleTest('EMAIL')}
                          disabled={testingChannel === 'EMAIL'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
                          title="Disparar e-mail de teste agora"
                        >
                          <Send className={\`w-3 h-3 \${testingChannel === 'EMAIL' ? 'animate-spin' : ''}\`} />
                          <span>{testingChannel === 'EMAIL' ? 'Enviando...' : 'Testar E-mail'}</span>
                        </button>
                      </div>
                    </div>`;

const replacementUI = `                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Disparo de Teste Personalizado (E-mail Específico):
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="teste.rapido@email.com"
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => {
                            setTestingChannel('EMAIL');
                            setTestFeedback(null);
                            onTestDispatch('EMAIL', testEmailAddress || settings.email.recipient)
                              .then((res) => {
                                setTestFeedback(res.message);
                                return onRefreshLogs();
                              })
                              .catch(() => setTestFeedback('Falha ao despachar notificação de teste.'))
                              .finally(() => {
                                setTestingChannel(null);
                                setTimeout(() => setTestFeedback(null), 5000);
                              });
                          }}
                          disabled={testingChannel === 'EMAIL' || (!testEmailAddress && !settings.email.recipient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Disparar e-mail de teste para este endereço"
                        >
                          <Send className={\`w-3 h-3 \${testingChannel === 'EMAIL' ? 'animate-spin' : ''}\`} />
                          <span>{testingChannel === 'EMAIL' ? 'Enviando...' : 'Testar E-mail'}</span>
                        </button>
                      </div>
                    </div>`;

if (!content.includes(targetState) || !content.includes(targetUI)) {
  console.log("Could not find target block");
} else {
  content = content.replace(targetState, replacementState);
  content = content.replace(targetUI, replacementUI);
  fs.writeFileSync(file, content);
  console.log("Success");
}
