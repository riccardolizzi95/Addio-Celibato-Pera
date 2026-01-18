'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Definiamo il tempo di inattività: 10 minuti (10 * 60 * 1000 millisecondi)
const IDLE_TIMEOUT = 10 * 60 * 1000;

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    console.log("Inattività rilevata per 10 minuti. Logout in corso...");
    await supabase.auth.signOut();
    router.push('/login');
  };

  const resetTimer = () => {
    // Ogni volta che l'utente si muove, cancelliamo il vecchio timer e ne facciamo uno nuovo
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Lista di eventi da monitorare per capire se l'utente è attivo
    const activityEvents = [
      'mousedown', 
      'mousemove', 
      'keydown', 
      'scroll', 
      'touchstart'
    ];

    // Aggiungiamo i "sensori" al browser
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Avviamo il primo timer all'avvio
    resetTimer();

    // Pulizia quando il componente viene rimosso
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return <>{children}</>;
}