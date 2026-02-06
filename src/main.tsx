import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

// Registrar Service Worker para notificaciones push
if ('serviceWorker' in navigator) {
  // Función para mostrar estado del Service Worker (visible en móvil)
  const showSWStatus = (message: string, isError = false) => {
    // Esperar a que el DOM esté listo
    const appendStatus = () => {
      // Crear elemento visible en pantalla
      const statusDiv = document.createElement('div');
      statusDiv.id = 'sw-status-indicator';
      statusDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: ${isError ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 90%;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      statusDiv.textContent = message;
      
      // Remover indicador anterior si existe
      const existing = document.getElementById('sw-status-indicator');
      if (existing) existing.remove();
      
      // Añadir al body o al root si body aún no existe
      if (document.body) {
        document.body.appendChild(statusDiv);
      } else {
        document.documentElement.appendChild(statusDiv);
      }
      
      // Auto-ocultar después de 5 segundos (solo si es éxito)
      if (!isError) {
        setTimeout(() => {
          statusDiv.style.transition = 'opacity 0.5s';
          statusDiv.style.opacity = '0';
          setTimeout(() => statusDiv.remove(), 500);
        }, 5000);
      }
      
      // También mostrar en consola
      if (isError) {
        console.error('❌ Service Worker:', message);
      } else {
        console.info('✅ Service Worker:', message);
      }
    };
    
    // Si el DOM está listo, añadir inmediatamente; sino esperar
    if (document.body || document.documentElement) {
      appendStatus();
    } else {
      document.addEventListener('DOMContentLoaded', appendStatus);
    }
  };

  // Registrar inmediatamente, no esperar a 'load' (mejor para móviles)
  const registerServiceWorker = async () => {
    try {
      showSWStatus('Registrando Service Worker...', false);
      
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
        scope: '/' // Scope explícito para toda la web
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
      
      // Verificar que el Service Worker esté realmente activo
      const activeSW = registration.active;
      if (activeSW && activeSW.state === 'activated') {
        showSWStatus('✅ Service Worker Registrado', false);
        console.info('Service Worker registrado correctamente:', registration.scope);
      } else {
        showSWStatus('⚠️ Service Worker en proceso...', false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      showSWStatus(`❌ Error: ${errorMsg.substring(0, 50)}`, true);
      console.error('Error al registrar Service Worker:', error);
      
      // En desarrollo, mostrar detalles adicionales
      if (import.meta.env.DEV) {
        console.warn('Detalles del error:', error);
        // En desarrollo, también mostrar alert para debugging
        setTimeout(() => {
          alert(`Error al registrar Service Worker:\n${errorMsg}\n\nRevisa la consola para más detalles.`);
        }, 1000);
      }
    }
  };
  
  // Intentar registrar inmediatamente
  registerServiceWorker();
  
  // También registrar cuando la página cargue (fallback)
  window.addEventListener('load', () => {
    // Solo reintentar si no hay un indicador de éxito visible
    const existing = document.getElementById('sw-status-indicator');
    if (!existing || existing.textContent?.includes('Error')) {
      registerServiceWorker();
    }
  });
} else {
  // Service Worker no soportado
  const showSWStatus = (message: string, isError = false) => {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'sw-status-indicator';
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${isError ? '#ef4444' : '#f59e0b'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 90%;
      text-align: center;
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
  };
  showSWStatus('⚠️ Service Worker no soportado', true);
  console.warn('Service Worker no está disponible en este navegador');
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
