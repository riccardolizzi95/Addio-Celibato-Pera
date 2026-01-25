'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. Nuovo stato per gestire il caricamento
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert("Inserisci email e password!");
    
    // Inizia il caricamento e disabilita il pulsante
    setIsLoading(true); 

    try {
      // Tentativo di login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setIsLoading(false);
        return alert(error.message);
      }

      // Se il login ha successo, cerchiamo il profilo
      const { data: profilo, error: profiloError } = await supabase
        .from('profili')
        .select('primo_accesso')
        .eq('id', data.user?.id)
        .maybeSingle();

      if (profiloError) {
        console.error("Errore nel recupero profilo:", profiloError);
      }

      // LOGICA DI REINDIRIZZAMENTO:
      if (!profilo || profilo.primo_accesso === true) {
        router.push('/setup-account');
      } else {
        router.push('/'); 
      }
    } catch (err) {
      console.error("Errore imprevisto durante il login:", err);
      alert("Si è verificato un errore imprevisto. Prova a ricaricare la pagina.");
    } finally {
      // In caso di errore o problemi, riattiviamo il pulsante dopo un po'
      // Se il login ha successo, il router cambierà pagina prima di questo
      setTimeout(() => setIsLoading(false), 5000); 
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
          className="w-full p-4 border rounded-2xl mb-4 outline-none focus:ring-2 ring-blue-500 disabled:opacity-50"
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          disabled={isLoading}
          className="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 ring-blue-500 disabled:opacity-50"
          onChange={e => setPassword(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
        >
          {isLoading ? (
            <>
              {/* Rotellina di caricamento (Spinner) */}
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Accesso in corso...
            </>
          ) : (
            "Accedi alla Missione"
          )}
        </button>
      </div>
    </main>
  );
}