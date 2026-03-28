'use client';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const timeoutInMinutes = 60;
  const timeoutInMs = timeoutInMinutes * 60 * 1000;

  // Pagine pubbliche dove non serve controllare la sessione
  const isPublicPage = pathname === '/login' || pathname === '/setup-account' || pathname === '/invito' || pathname?.startsWith('/auth');

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('lastActivity');
      await supabase.auth.signOut();
    } catch {
      // Ignora errori di signOut — la sessione potrebbe essere già scaduta
    }
    window.location.assign('/login');
  }, []);

  const checkInactivity = useCallback(() => {
    if (isPublicPage) return;
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const diff = Date.now() - parseInt(lastActivity, 10);
      if (diff > timeoutInMs) {
        logout();
      }
    }
  }, [logout, timeoutInMs, isPublicPage]);

  const updateActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  useEffect(() => {
    if (isPublicPage) return;

    // Controllo immediato al caricamento
    checkInactivity();

    // Controlla anche la sessione Supabase — se è scaduta, manda al login
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          logout();
        }
      } catch {
        // Se c'è un errore nel controllare la sessione, manda al login
        logout();
      }
    };
    checkSession();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Controllo periodico ogni 30 secondi
    const interval = setInterval(checkInactivity, 30000);

    // Listener per quando la pagina torna in foreground (es. switch tab su mobile)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkInactivity, isPublicPage, logout]);

  return <>{children}</>;
}