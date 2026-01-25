'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const searchParams = useSearchParams();

  // Recuperiamo l'eventuale link di destinazione originale
  const returnTo = searchParams.get('returnTo');

  const handleLogin = async () => {
    if (!email || !password) return alert("Inserisci email e password!");
    setIsLoading(true); 

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setIsLoading(false);
        return alert(error.message);
      }

      // Recuperiamo il profilo per controllare il primo accesso
      const { data: profilo } = await supabase
        .from('profili')
        .select('primo_accesso')
        .eq('id', data.user?.id)
        .maybeSingle();

      // SOLUZIONE DEFINITIVA: Forziamo il ricaricamento della pagina di destinazione
      // window.location.href agisce come un refresh manuale, risolvendo il problema dei telefoni
      if (!profilo || profilo.primo_accesso === true) {
        window.location.href = '/setup-account';
      } else {
        // Se non c'è returnTo, andiamo in home
        window.location.href = returnTo || '/'; 
      }
    } catch (err) {
      console.error("Errore login:", err);
      alert("Errore imprevisto. Riprova.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
        <h1 className="text-3xl font-bold mb-2 text-center">🍐 Missione Pera</h1>
        <p className="text-slate-500 text-center mb-8">Inserisci le credenziali ricevute</p>
        
        <input 
          type="email" 
          placeholder="Email" 
          disabled={isLoading}
          className="w-full p-4 border rounded-2xl mb-4 outline-none focus:ring-2 ring-blue-500 disabled:opacity-50 bg-white"
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          disabled={isLoading}
          className="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 ring-blue-500 disabled:opacity-50 bg-white"
          value={password}
          onChange={e => setPassword(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
        >
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Accesso...</>
          ) : (
            "Accedi alla Missione"
          )}
        </button>
      </div>
    </main>
  );
}