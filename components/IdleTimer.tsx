'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const TIMEOUT = 60 * 60 * 1000;

    const isPublic = () => {
      const p = window.location.pathname;
      return p === '/login' || p === '/setup-account' || p === '/invito' || p === '/profilo' || p.startsWith('/auth');
    };

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkIdle = () => {
      if (isPublic()) return;
      const last = localStorage.getItem('lastActivity');
      if (last && Date.now() - parseInt(last, 10) > TIMEOUT) {
        localStorage.removeItem('lastActivity');
        supabase.auth.signOut().catch(() => {});
        window.location.assign('/login');
      }
    };

    checkIdle();
    const interval = setInterval(checkIdle, 30000);
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, []);

  return <>{children}</>;
}
