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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <span className="text-6xl mb-4 block">🍐</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Missione Pera</h1>
        <p className="mt-2 text-slate-600">Il centro di comando per l'addio al celibato più epico di sempre.</p>

        <div className="mt-8 space-y-4 flex flex-col items-center">
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-all">
            ✈️ Voli & Alloggi
          </button>

          <Link href="/attivita" className="w-full block text-slate-900">
            <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 active:scale-95 transition-all">
              🎉 Proponi Attività
            </button>
          </Link>

          <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-amber-200 active:scale-95 transition-all">
            💰 Gestione Spese
          </button>
          
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600"
          >
            Esci (Logout)
          </button>
        </div>
      </div>
    </main>
  );
}