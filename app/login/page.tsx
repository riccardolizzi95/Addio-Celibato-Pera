'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const searchParams = useSearchParams();
  
  // Link di ritorno (es: la minuta) o Home
  const returnTo = searchParams.get('returnTo') || '/';

  // --- SOLUZIONE AL LOOP ---
  // Se arrivo qui ma ho già una sessione attiva (succede nel loop su mobile),
  // vai dritto alla destinazione senza chiedere nulla.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = returnTo;
      }
    };
    checkSession();
  }, [returnTo]);

  const handleLogin = async () => {
    if (!email || !password) return alert("Inserisci email e password!");
    
    // Pulizia email (utile su mobile per evitare spazi extra alla fine)
    const cleanEmail = email.trim();
    setIsLoading(true); 

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password: password 
      });
      
      if (error) {
        setIsLoading(false);
        // Messaggi più chiari per l'utente
        if (error.message.includes("Invalid login credentials")) {
          return alert("Credenziali errate. Controlla email e password.");
        }
        return alert(error.message);
      }

      // Recuperiamo il profilo per il controllo primo accesso
      const { data: profilo } = await supabase
        .from('profili')
        .select('primo_accesso')
        .eq('id', data.user?.id)
        .maybeSingle();

      // Usiamo window.location.href per forzare il refresh e "pulire" lo stato del browser
      if (!profilo || profilo.primo_accesso === true) {
        window.location.href = '/setup-account';
      } else {
        window.location.href = returnTo; 
      }
    } catch (err) {
      console.error("Errore login:", err);
      setIsLoading(false);
      alert("Errore di rete. Prova a ricaricare.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
        <h1 className="text-3xl font-bold mb-2 text-center">🍐 Missione Pera</h1>
        <p className="text-slate-500 text-center mb-8">Accesso riservato alla missione</p>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            disabled={isLoading}
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500 disabled:opacity-50 bg-white border-slate-200"
            value={email}
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            disabled={isLoading}
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500 disabled:opacity-50 bg-white border-slate-200"
            value={password}
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          
          <button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-400"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Accesso in corso...
              </>
            ) : (
              "Accedi alla Missione"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}