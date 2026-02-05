import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import type { UserProfile } from '../types';
import { createOrUpdateUser } from '../services/alarmService';
import { requestNotificationPermission, onForegroundMessage } from '../services/notificationService';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (p: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => void;
  clearLoginError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const setProfile = useCallback((p: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    setProfileState(p);
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoginError(null);
      if (u) {
        try {
          const p = await createOrUpdateUser(u);
          setProfileState(p);
          
          // Esperar un momento para asegurar que la autenticación esté completa
          // antes de solicitar permisos de notificación
          setTimeout(async () => {
            // Verificar nuevamente que el usuario sigue autenticado
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid === u.uid) {
              try {
                await requestNotificationPermission(u.uid);
                onForegroundMessage();
              } catch (notificationError) {
                // Error ya manejado en requestNotificationPermission
                console.debug('Error al solicitar permisos de notificación:', notificationError);
              }
            }
          }, 1000); // Esperar 1 segundo después de la autenticación
        } catch (e) {
          console.error('Error al cargar perfil:', e);
          setProfileState({
            uid: u.uid,
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            photoURL: u.photoURL ?? null,
            groupId: null
          });
        }
      } else {
        setProfileState(null);
      }
      setLoading(false);
    });

    getRedirectResult(auth).catch((err) => {
      console.error('Error al completar redirect:', err);
      setLoginError(err?.message ?? 'Error al iniciar sesión');
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged actualizará user/profile; no hace falta redirigir, la app re-renderiza
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message ?? 'Error al iniciar sesión';

      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        // El navegador bloqueó el popup: usar redirect
        try {
          await signInWithRedirect(auth, googleProvider);
          // La página se recargará y getRedirectResult procesará el resultado
        } catch (redirectErr) {
          console.error('Error en redirect:', redirectErr);
          setLoginError((redirectErr as Error)?.message ?? 'No se pudo abrir la ventana de Google.');
        }
      } else {
        setLoginError(message);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    setLoginError(null);
    await signOut(auth);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    loginError,
    login,
    logout,
    setProfile,
    clearLoginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
