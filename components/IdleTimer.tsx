'use client';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timeoutInMinutes = 10;
  const timeoutInMs = timeoutInMinutes * 60 * 1000;

  const logout = useCallback(async () => {
    localStorage.removeItem('lastActivity'); // Pulisce il timestamp
    await supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  const checkInactivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const now = Date.now();
      const diff = now - parseInt(lastActivity, 10);

      // Se la differenza è maggiore di 10 minuti, slogga
      if (diff > timeoutInMs) {
        logout();
      }
    }
  }, [logout, timeoutInMs]);

  const updateActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  useEffect(() => {
    // 1. Controllo immediato al caricamento (fondamentale per il mobile)
    checkInactivity();

    // 2. Eventi da monitorare per resettare l'attività
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // 3. Controllo periodico ogni 30 secondi mentre la pagina è aperta
    const interval = setInterval(checkInactivity, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [checkInactivity]);

  return <>{children}</>;
}