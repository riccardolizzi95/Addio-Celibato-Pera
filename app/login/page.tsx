'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return alert(error.message);

    // Cerchiamo il profilo dell'utente
    const { data: profilo, error: profiloError } = await supabase
      .from('profili')
      .select('primo_accesso')
      .eq('id', data.user?.id)
      .maybeSingle(); // Usiamo maybeSingle così non va in errore se non trova nulla

    // LOGICA DI REINDIRIZZAMENTO:
    // Se il profilo non esiste (null) o se è il primo accesso, vai a setup-account
    if (!profilo || profilo.primo_accesso === true) {
      router.push('/setup-account');
    } else {
      // Se il profilo esiste già e non è il primo accesso, vai in attività
      router.push('/attivita');
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
          className="w-full p-4 border rounded-2xl mb-4 outline-none focus:ring-2 ring-blue-500"
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password temporanea" 
          className="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 ring-blue-500"
          onChange={e => setPassword(e.target.value)} 
        />
        
        <button 
          onClick={handleLogin} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          Accedi alla Missione
        </button>
      </div>
    </main>
  );
}