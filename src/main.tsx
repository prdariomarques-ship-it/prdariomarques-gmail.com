import './utils/domPatch';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="Falha na Inicialização da Aplicação">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
