'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) window.location.assign(returnTo);
    };
    checkSession();
  }, [returnTo]);

  const handleLogin = async () => {
    if (!email || !password) return setMessage({text: "Inserisci email e password!", type: 'error'});
    setIsLoading(true); 
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password: password 
    });
    
    if (error) {
      setIsLoading(false);
      return setMessage({text: "Credenziali errate o account non attivato.", type: 'error'});
    }

    const { data: profilo } = await supabase.from('profili').select('primo_accesso').eq('id', data.user?.id).maybeSingle();
    window.location.assign((!profilo || profilo.primo_accesso) ? '/setup-account' : returnTo);
  };

  const handleResetPassword = async () => {
    if (!email) return setMessage({text: "Inserisci la tua mail!", type: 'error'});
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/setup-account`,
    });
    setIsLoading(false);
    if (error) return setMessage({text: error.message, type: 'error'});
    setMessage({text: "Mail di recupero inviata! Controlla la posta.", type: 'success'});
    setTimeout(() => setForgotMode(false), 3000);
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <span className="text-6xl mb-4 block">🍐</span>
        <h1 className="text-3xl font-black tracking-tight">Missione Pera</h1>
        <p className="text-slate-500 font-medium">Addio al Celibato</p>
      </div>
      
      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="email" placeholder="Email" disabled={isLoading}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={email} onChange={e => setEmail(e.target.value)} 
          />
        </div>

        {!forgotMode && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="password" placeholder="Password" disabled={isLoading}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        )}

        <button 
          onClick={forgotMode ? handleResetPassword : handleLogin} 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (forgotMode ? "Invia Link Recupero" : "Accedi alla Missione")}
          {!isLoading && <ArrowRight size={20} />}
        </button>

        <button 
          onClick={() => { setForgotMode(!forgotMode); setMessage(null); }}
          className="w-full text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors py-2"
        >
          {forgotMode ? "Torna al login" : "Hai dimenticato la password?"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <Suspense fallback={<div>Caricamento...</div>}><LoginForm /></Suspense>
    </main>
  );
}