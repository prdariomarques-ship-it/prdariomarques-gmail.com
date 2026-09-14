import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const replacement = `
// ==========================================
// CONTROLE DE AUTENTICAÇÃO E SESSÃO OBRIGATÓRIA (/api/*)
// Bloqueia qualquer requisição sem Bearer token válido
// ==========================================
const VALID_API_TOKENS = new Set<string>();
if (process.env.API_TOKEN) {
  VALID_API_TOKENS.add(process.env.API_TOKEN.trim());
}

app.use('/api', (req, res, next) => {
  // Desativa qualquer cache em navegador ou proxy para rotas /api/*
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Permitir requisições OPTIONS pré-flight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  // 1. Tenta validar via Header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (VALID_API_TOKENS.has(token)) {
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Acesso não autorizado: Token de API incorreto.',
        code: 'INVALID_TOKEN',
      });
    }
  }

  // 2. Tenta validar via Header X-API-Key
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && VALID_API_TOKENS.has(apiKeyHeader.trim())) {
    return next();
  }

  // Nenhuma credencial válida fornecida -> 401 Unauthorized
  return res.status(401).json({
    success: false,
    error: 'Acesso não autorizado: Autenticação Bearer obrigatória.',
    code: 'AUTH_REQUIRED',
  });
});
`;

// Extract before line 40 and after line 117
const lines = content.split('\n');
const before = lines.slice(0, 38).join('\n'); // lines 1 to 38
const after = lines.slice(117).join('\n'); // lines 118 to end

fs.writeFileSync('server.ts', before + '\n' + replacement + '\n' + after);
console.log('Updated server.ts auth logic!');
