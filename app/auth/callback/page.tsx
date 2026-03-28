'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase mette i token nell'hash dopo il redirect
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type'); // "recovery" per reset password, "magiclink" per magic link

      if (accessToken && refreshToken) {
        // Scambia i token per una sessione
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError('Errore di autenticazione. Riprova.');
          setTimeout(() => window.location.assign('/login'), 3000);
          return;
        }

        if (type === 'recovery') {
          // Reset password → manda al profilo dove può cambiare password
          window.location.assign('/profilo');
        } else {
          // Magic link o invito → controlla primo_accesso
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
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
            window.location.assign('/login');
          }
        }
        return;
      }

      // Se non ci sono token nell'hash, controlla se c'è già una sessione
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.assign('/');
      } else {
        window.location.assign('/login');
      }
    };

    // Attendi che supabase-js processi l'hash
    setTimeout(handleCallback, 500);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        {error ? (
          <>
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="text-red-500 font-bold">{error}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Accesso in corso...</p>
          </>
        )}
      </div>
    </div>
  );
}