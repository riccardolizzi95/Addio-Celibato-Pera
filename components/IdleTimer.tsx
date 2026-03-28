'use client';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const timeoutInMs = 60 * 60 * 1000; // 60 minuti

  const logout = useCallback(async () => {
    // Non fare nulla se siamo su pagine pubbliche
    const path = window.location.pathname;
    if (path === '/login' || path === '/setup-account' || path === '/invito' || path === '/profilo' || path.startsWith('/auth')) return;
    
    try {
      localStorage.removeItem('lastActivity');
      await supabase.auth.signOut();
    } catch {
      // Ignora errori — sessione potrebbe essere già scaduta
    }
    window.location.assign('/login');
  }, []);

  const checkInactivity = useCallback(() => {
    const path = window.location.pathname;
    if (path === '/login' || path === '/setup-account' || path === '/invito' || path === '/profilo' || path.startsWith('/auth')) return;
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const diff = Date.now() - parseInt(lastActivity, 10);
      if (diff > timeoutInMs) {
        logout();
      }
    }
  }, [logout, timeoutInMs]);

  const updateActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  useEffect(() => {
    checkInactivity();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    const interval = setInterval(checkInactivity, 30000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
    };
  }, [checkInactivity]);

  return <>{children}</>;
}