'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function InvitoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleInvite = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg('Link non valido.');
        return;
      }

      // 1. Cerca il token nella tabella inviti_pendenti
      const { data: invito, error: fetchError } = await supabase
        .from('inviti_pendenti')
        .select('email, temp_password, used')
        .eq('token', token)
        .maybeSingle();

      if (fetchError || !invito) {
        setStatus('error');
        setErrorMsg('Link non valido o scaduto.');
        return;
      }

      if (invito.used) {
        setStatus('error');
        setErrorMsg('Questo link è già stato utilizzato. Accedi dal login.');
        return;
      }

      // 2. Login con le credenziali temporanee
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: invito.email,
        password: invito.temp_password,
      });

      if (loginError) {
        setStatus('error');
        setErrorMsg('Errore di accesso. Contatta l\'organizzatore.');
        return;
      }

      // 3. Segna il token come usato (best effort, non blocca il flusso)
      await supabase
        .from('inviti_pendenti')
        .update({ used: true })
        .eq('token', token);

      // 4. Redirect al setup account
      window.location.assign('/setup-account');
    };

    handleInvite();
  }, [token]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center w-full max-w-sm">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-black mb-2">Oops!</h1>
          <p className="text-slate-500 mb-6">{errorMsg}</p>
          <a href="/login" className="inline-block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
            Vai al Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Accesso in corso...</p>
      </div>
    </div>
  );
}

export default function InvitoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <InvitoContent />
    </Suspense>
  );
}