'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      // Supabase mette il token nell'hash dell'URL dopo il redirect
      // supabase-js lo intercetta automaticamente con onAuthStateChange
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // Utente autenticato, controlla se deve fare il setup
        const { data: profilo } = await supabase
          .from('profili')
          .select('primo_accesso, gruppo')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profilo?.primo_accesso === true) {
          window.location.assign('/setup-account');
        } else if (profilo?.gruppo === 'nubilato') {
          window.location.assign('/nubilato');
        } else {
          window.location.assign('/');
        }
      } else {
        // Se non c'è sessione, prova a scambiare il token dall'URL
        // Supabase potrebbe aver bisogno di un momento
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!setError) {
            window.location.assign('/setup-account');
            return;
          }
        }
        
        // Fallback: torna al login
        window.location.assign('/login');
      }
    };

    // Attendi un attimo che supabase-js processi l'hash
    setTimeout(handleCallback, 500);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Accesso in corso...</p>
      </div>
    </div>
  );
}