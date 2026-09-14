/**
 * Cliente de API com Autenticação Centralizada Bearer Token para o FlowCore Sentinel
 */

declare const __FLOWCORE_RUNTIME_TOKEN__: string | undefined;

const STORAGE_KEY = 'FLOWCORE_api_token';

// Obtém o token definido em tempo de compilação ou execução
function resolveDefaultToken(): string {
  if (typeof window !== 'undefined' && (window as any).__FLOWCORE_INITIAL_TOKEN__) {
    return (window as any).__FLOWCORE_INITIAL_TOKEN__;
  }
  if (typeof __FLOWCORE_RUNTIME_TOKEN__ !== 'undefined' && __FLOWCORE_RUNTIME_TOKEN__) {
    return __FLOWCORE_RUNTIME_TOKEN__;
  }
  // Removemos o token hardcoded de fallback conforme instrução de segurança.
  // Deve ser configurado via VITE_API_TOKEN ou inserido na interface pelo usuário.
  return (import.meta as any).env?.VITE_API_TOKEN || '';
}

export const DEFAULT_DEV_TOKEN = resolveDefaultToken();

type AuthListener = (token: string) => void;
type AuthStatusListener = (hasAuthError: boolean, lastErrorDetail?: string) => void;

const authListeners: Set<AuthListener> = new Set();
const authStatusListeners: Set<AuthStatusListener> = new Set();

let lastAuthErrorState: boolean = false;
let lastAuthErrorMessage: string = '';

// Verifica se há token fornecido na URL (ex: ?token=meu-token-secreto)
function detectTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken && urlToken.trim().length > 0) {
      return urlToken.trim();
    }
  } catch {
    // Ignora erros de parsing de URL
  }
  return null;
}

/**
 * Retorna o token de autenticação ativo.
 * Prioridade: URL parameter > localStorage > Default Dev Token
 */
export function getAuthToken(): string {
  if (typeof window === 'undefined') return DEFAULT_DEV_TOKEN;

  // 1. Tenta recuperar da URL se presente e salva no storage
  const urlToken = detectTokenFromUrl();
  if (urlToken) {
    try {
      localStorage.setItem(STORAGE_KEY, urlToken);
    } catch {
      // Ignora erro de cota
    }
    return urlToken;
  }

  // 2. Recupera do localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // Ignora erro de acesso a localStorage
  }

  // 3. Fallback para o token padrão
  return DEFAULT_DEV_TOKEN;
}

/**
 * Salva um novo token de autenticação no localStorage e notifica todos os componentes
 */
export function setAuthToken(token: string): void {
  const cleanToken = token.trim();
  try {
    if (cleanToken) {
      localStorage.setItem(STORAGE_KEY, cleanToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[Auth] Erro ao salvar token no localStorage:', e);
  }

  // Reseta estado de erro após o usuário atualizar o token
  setAuthError(false);

  authListeners.forEach((fn) => {
    try {
      fn(cleanToken || DEFAULT_DEV_TOKEN);
    } catch {
      // Ignora erro no listener
    }
  });
}

/**
 * Inscreve um componente para receber atualizações quando o token mudar
 */
export function subscribeAuthChange(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

/**
 * Inscreve um componente para saber se a API retornou 401 Unauthorized
 */
export function subscribeAuthStatusChange(listener: AuthStatusListener): () => void {
  authStatusListeners.add(listener);
  listener(lastAuthErrorState, lastAuthErrorMessage);
  return () => {
    authStatusListeners.delete(listener);
  };
}

export function setAuthError(hasError: boolean, message: string = ''): void {
  lastAuthErrorState = hasError;
  lastAuthErrorMessage = message;
  authStatusListeners.forEach((fn) => {
    try {
      fn(hasError, message);
    } catch {
      // Ignora erro
    }
  });
}

export function getAuthErrorState(): { hasError: boolean; message: string } {
  return { hasError: lastAuthErrorState, message: lastAuthErrorMessage };
}

/**
 * Executa uma chamada fetch com o header Authorization: Bearer <token> injetado.
 * Detecta respostas 401 para alertar o usuário sobre token inválido.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const currentToken = getAuthToken();

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const enhancedInit: RequestInit = {
    ...init,
    credentials: init?.credentials || 'include',
    headers,
  };

  try {
    const res = await fetch(input, enhancedInit);

    if (res.status === 401) {
      let errDetail = 'Não autorizado (401)';
      try {
        const cloned = res.clone();
        const json = await cloned.json();
        if (json?.error) {
          errDetail = json.error;
        }
      } catch {
        // Ignora parse error
      }
      setAuthError(true, errDetail);
      console.warn(`[Auth] Requisição para ${input} rejeitada com 401 Unauthorized. Motivo: ${errDetail}`);
    } else if (res.ok && lastAuthErrorState) {
      setAuthError(false);
    }

    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * Helper para buscar e parsear JSON com autenticação Bearer
 */
export async function safeAuthenticatedJsonFetch<T = any>(
  url: string,
  init?: RequestInit
): Promise<T | null> {
  try {
    const res = await authenticatedFetch(url, init);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      console.warn(`[API] Resposta não-JSON de ${url} (status ${res.status})`);
      return null;
    }
  } catch (err) {
    console.warn(`[API] Falha de rede ao requisitar ${url}:`, err);
    return null;
  }
}

/**
 * Testa a validade de um token diretamente contra o backend
 */
export async function testTokenValidation(
  tokenToTest: string
): Promise<{ success: boolean; status: number; message: string; latencyMs: number }> {
  const start = performance.now();
  try {
    const res = await fetch(`/api/notifications/settings?_t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${tokenToTest.trim()}`,
      },
    });
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        success: true,
        status: res.status,
        message: 'Token válido e autenticado com sucesso no FlowCore Sentinel!',
        latencyMs,
      };
    } else if (res.status === 401) {
      let errorMsg = 'Acesso Negado (401): Token incorreto ou não configurado.';
      try {
        const data = await res.json();
        if (data?.error) errorMsg = data.error;
      } catch {
        // Ignora
      }
      return {
        success: false,
        status: 401,
        message: errorMsg,
        latencyMs,
      };
    } else {
      return {
        success: false,
        status: res.status,
        message: `Servidor retornou código HTTP ${res.status}`,
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      message: `Falha de rede ao testar token: ${err?.message || 'Sem conexão'}`,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
