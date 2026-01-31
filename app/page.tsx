'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.assign(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 text-slate-900 p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center">
        <span className="text-8xl mb-6 drop-shadow-sm font-normal">🍐</span>
        <h1 className="text-4xl font-black tracking-tight mb-2">Missione Pera</h1>
        <p className="text-slate-500 mb-10 text-lg text-center leading-relaxed font-normal">
          Il centro di comando per l'addio al celibato più epico di sempre.
        </p>

        <div className="w-full space-y-4">
          <Link href="/voli" className="w-full block">
            <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              ✈️ Voli & Alloggi
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
        </div>
      </div>
      
      <div className="py-8"></div>
    </main>
  );
}