import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@fontsource-variable/inter';
import { HashRouter } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

// Global error handlers for renderer
window.addEventListener('error', (event) => {
  console.error('[Renderer] Uncaught error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Renderer] Unhandled rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <NotificationProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </NotificationProvider>
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>
)
