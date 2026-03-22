'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NubilatoAlloggioPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.assign('/login'); return; }
      const { data: p } = await supabase.from('profili').select('gruppo, admin').eq('id', session.user.id).single();
      if (p?.gruppo !== 'nubilato' && !p?.admin) { window.location.assign('/'); return; }
      setLoading(false);
    };
    check();
  }, []);
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" /></div>;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 text-center">
      <div className="w-full max-w-sm">
        <span className="text-8xl mb-6 block animate-pulse">🏠</span>
        <h1 className="text-4xl font-black mb-2 tracking-tight">Alloggio</h1>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed">Sezione in arrivo per la Missione Yas! 💍</p>
        <Link href="/nubilato" className="inline-block w-full bg-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-pink-100 active:scale-95 transition-all">Torna alla base</Link>
      </div>
    </main>
  );
}
