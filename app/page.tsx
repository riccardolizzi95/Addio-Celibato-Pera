'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 text-slate-900 p-6">
      {/* Contenuto Centrale senza il blocco bianco */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center">
        <span className="text-8xl mb-6 drop-shadow-sm">🍐</span>
        <h1 className="text-4xl font-black tracking-tight mb-2">Missione Pera</h1>
        <p className="text-slate-500 mb-10 text-lg">
          Il centro di comando per l'addio al celibato più epico di sempre.
        </p>

        <div className="w-full space-y-4">
          <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3">
            ✈️ Voli & Alloggi
          </button>

          <Link href="/attivita" className="w-full block">
            <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🎉 Proponi Attività
            </button>
          </Link>

          <button className="w-full bg-amber-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-3">
            💰 Gestione Spese
          </button>
        </div>
      </div>

      {/* Logout posizionato in fondo alla pagina */}
      <footer className="w-full py-8 flex justify-center">
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors underline underline-offset-4"
        >
          Disconnetti Account (Logout)
        </button>
      </footer>
    </main>
  );
}