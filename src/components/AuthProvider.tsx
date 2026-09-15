import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '../lib/firebase';
import { ShieldAlert, LogIn, Loader2, Bot } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">Iniciando ambiente seguro...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-20 blur-[100px]"></div>

        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <Bot className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">FlowCore Sentinel</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sistema Integrado de Monitoramento, Alertas e Compliance de Portfólios de Investimento.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex gap-3 text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-slate-300">
              Acesso restrito. Por favor, autentique-se com sua credencial corporativa para acessar o command center.
            </p>
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 px-4 py-3.5 rounded-xl text-sm font-semibold hover:bg-slate-100 transition shadow-[0_2px_10px_rgba(255,255,255,0.1)] active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Fazer login com o Google
          </button>
        </div>
        <div className="relative z-10 mt-8 text-xs text-slate-600 font-medium tracking-wide">
          FLOWCORE SECURITIES © 2026
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
