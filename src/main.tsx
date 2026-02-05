import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

// Registrar Service Worker para notificaciones push
if ('serviceWorker' in navigator) {
  // Registrar inmediatamente, no esperar a 'load' (mejor para móviles)
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
        scope: '/' 
      });
      
      // Esperar a que el Service Worker esté activo (importante para Android)
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing!.addEventListener('statechange', () => {
            if (registration.installing!.state === 'activated') {
              resolve();
            }
          });
        });
      } else if (registration.waiting) {
        // Si está esperando, activarlo
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      console.info('Service Worker registrado correctamente:', registration.scope);
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
      // En desarrollo, mostrar siempre; en producción, solo errores críticos
      if (import.meta.env.DEV) {
        console.warn('Detalles del error:', error);
      }
    }
  };
  
  // Intentar registrar inmediatamente
  registerServiceWorker();
  
  // También registrar cuando la página cargue (fallback)
  window.addEventListener('load', registerServiceWorker);
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en la app:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#b91c1c' }}>Algo ha fallado</h1>
          <pre style={{ background: '#fef2f2', padding: '1rem', overflow: 'auto' }}>
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró el elemento #root. Revisa index.html.')
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
