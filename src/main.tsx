import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/AuthProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Falha na Inicialização do FlowCore Sentinel">
      <AuthProvider>
      <App />
    </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

