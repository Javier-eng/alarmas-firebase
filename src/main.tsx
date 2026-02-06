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
    const swPath = '/firebase-messaging-sw.js';
    
    try {
      showSWStatus('Registrando Service Worker...', false);
      
      // Verificar que el archivo existe antes de registrarlo
      try {
        const response = await fetch(swPath, { method: 'HEAD' });
        if (!response.ok && response.status !== 404) {
          throw new Error(`Archivo no accesible: HTTP ${response.status}`);
        }
      } catch (fetchError) {
        console.warn('No se pudo verificar el archivo SW (puede ser normal):', fetchError);
      }
      
      // Registrar con path absoluto y scope explícito
      const registration = await navigator.serviceWorker.register(swPath, { 
        scope: '/' // Scope explícito para toda la web
      });
      
      console.info('Service Worker registro iniciado, scope:', registration.scope);
      
      // Esperar a que el Service Worker esté activo (importante para Android)
      if (registration.installing) {
        console.info('Service Worker instalando...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout esperando activación del Service Worker'));
          }, 10000); // 10 segundos timeout
          
          registration.installing!.addEventListener('statechange', () => {
            const state = registration.installing!.state;
            console.info('Service Worker estado:', state);
            if (state === 'activated') {
              clearTimeout(timeout);
              resolve();
            } else if (state === 'redundant') {
              clearTimeout(timeout);
              reject(new Error('Service Worker marcado como redundante'));
            }
          });
        });
      } else if (registration.waiting) {
        console.info('Service Worker esperando, activando...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // Esperar un momento para que se active
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Verificar que el Service Worker esté realmente activo
      const activeSW = registration.active;
      if (activeSW && activeSW.state === 'activated') {
        showSWStatus('✅ Service Worker Registrado', false);
        console.info('✅ Service Worker registrado correctamente:', registration.scope);
      } else {
        const state = activeSW?.state || 'unknown';
        throw new Error(`Service Worker no activado. Estado: ${state}`);
      }
    } catch (error) {
      // Capturar error completo con todos los detalles
      let errorDetails = '';
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = `Mensaje: ${error.message}\n`;
        if (error.stack) {
          errorDetails += `Stack: ${error.stack.substring(0, 200)}\n`;
        }
        if ((error as any).name) {
          errorDetails += `Tipo: ${(error as any).name}\n`;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorDetails = `Error: ${error}`;
      } else {
        errorMessage = String(error);
        errorDetails = `Error: ${JSON.stringify(error, null, 2)}`;
      }
      
      // Detectar tipo de error común
      let errorType = 'Desconocido';
      if (errorMessage.includes('Failed to register') || errorMessage.includes('register')) {
        errorType = 'Error de registro';
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorType = 'Archivo no encontrado';
      } else if (errorMessage.includes('MIME') || errorMessage.includes('content-type')) {
        errorType = 'Error de MIME type';
      } else if (errorMessage.includes('scope') || errorMessage.includes('permission')) {
        errorType = 'Error de permisos/scope';
      } else if (errorMessage.includes('HTTPS') || errorMessage.includes('secure')) {
        errorType = 'Error de seguridad (requiere HTTPS)';
      }
      
      // Mostrar error en pantalla
      showSWStatus(`❌ Error: ${errorType}`, true);
      console.error('❌ Error completo al registrar Service Worker:', error);
      console.error('Detalles:', errorDetails);
      
      // Mostrar alert con error técnico completo (especialmente importante en móvil)
      const fullErrorMsg = `Error al registrar Service Worker\n\n` +
        `Tipo: ${errorType}\n` +
        `Mensaje: ${errorMessage}\n\n` +
        `Path intentado: ${swPath}\n` +
        `Scope: /\n\n` +
        `Detalles técnicos:\n${errorDetails.substring(0, 300)}`;
      
      // Siempre mostrar alert en móvil, también en desarrollo
      setTimeout(() => {
        alert(fullErrorMsg);
      }, 1500);
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
