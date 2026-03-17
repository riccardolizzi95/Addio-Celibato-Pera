'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Se non c'è sessione, manda al login
        const currentUrl = window.location.pathname + window.location.search;
        window.location.assign(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
        return;
      }

      // Se loggato, verifichiamo lo stato del profilo
      const { data: profilo, error } = await supabase
        .from('profili')
        .select('primo_accesso')
        .eq('id', session.user.id)
        .maybeSingle();

      // Se il profilo non esiste ancora o primo_accesso è true, manda al setup
      if (!profilo || profilo.primo_accesso === true) {
        window.location.assign('/setup-account');
      } else {
        // Altrimenti, carica la Home
        setLoading(false);
      }
    };
    
    checkUserAndStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center bg-slate-50 text-slate-900 p-6">
      <div className="flex flex-col items-center w-full max-w-sm text-center pt-4">
        <span className="text-8xl mb-10 drop-shadow-sm font-normal">🍐</span>

        <div className="w-full space-y-4">
          <Link href="/voli" className="w-full block">
            <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              ✈️ Voli & Logistica
            </button>
          </Link>
          
          <Link href="/alloggio" className="w-full block">
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🏠 Alloggio
            </button>
          </Link>

          <Link href="/attivita" className="w-full block">
            <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🎉 Proponi Attività
            </button>
          </Link>
          
          <Link href="/spese" className="w-full block">
            <button className="w-full bg-amber-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              💰 Gestione Spese
            </button>
          </Link>

          <Link href="/scherzi" className="w-full block">
            <button className="w-full bg-purple-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-purple-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              😈 Scherzi Matrimonio
            </button>
          </Link>
        </div>
      </div>
      <div className="py-8"></div>
    </main>
  );
}