'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NubilatoHome() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.assign('/login'); return; }
      const { data: profilo } = await supabase.from('profili').select('primo_accesso, gruppo, admin').eq('id', session.user.id).maybeSingle();
      if (profilo?.primo_accesso === true) { window.location.assign('/setup-account'); return; }
      if (profilo?.gruppo !== 'nubilato' && !profilo?.admin) { window.location.assign('/'); return; }
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">
      <style>{`
        @keyframes drift1 { 0% { transform: translateX(-8%); } 50% { transform: translateX(4%); } 100% { transform: translateX(-8%); } }
        @keyframes drift2 { 0% { transform: translateX(6%); } 50% { transform: translateX(-5%); } 100% { transform: translateX(6%); } }
        @keyframes fly {
          0%   { transform: translate(-80px, 0px); opacity: 0; }
          6%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate(calc(100vw + 80px), -14px); opacity: 0; }
        }
        @keyframes scia {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 0.4; }
          100% { opacity: 0; }
        }
        .cloud { position: absolute; border-radius: 50%; background: white; }
        .cloud-group { position: absolute; }
        .cg1 { top: 18%; left: -5%; animation: drift1 22s ease-in-out infinite; }
        .cg1 .c1 { width:90px; height:36px; top:16px; left:0; background: rgba(255,255,255,0.92); border-radius:50px; filter:blur(2px); }
        .cg1 .c2 { width:60px; height:44px; top:0; left:18px; background: rgba(255,255,255,0.95); border-radius:50%; filter:blur(1px); }
        .cg2 { top: 8%; left: 28%; animation: drift2 28s ease-in-out infinite 4s; }
        .cg2 .c1 { width:130px; height:44px; top:22px; left:0; background: rgba(255,255,255,0.88); border-radius:60px; filter:blur(3px); }
        .cg2 .c2 { width:80px; height:60px; top:0; left:22px; background: rgba(255,255,255,0.95); border-radius:50%; filter:blur(1px); }
        .plane-wrap {
          position: absolute; top: 30%; left: 0;
          animation: fly 9s linear infinite 0.5s;
          display: flex; align-items: center;
        }
        .plane-svg { width: 44px; height: 44px; opacity: 0.55; transform: rotate(30deg); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15)); }
        .plane-scia { width: 80px; height: 2px; background: linear-gradient(to left, rgba(148,163,184,0.5), transparent); border-radius: 2px; margin-right: 4px; animation: scia 9s linear infinite 0.5s; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fu1 { animation: fadeUp 0.5s ease both 0.05s; }
        .fu2 { animation: fadeUp 0.5s ease both 0.12s; }
        .fu3 { animation: fadeUp 0.5s ease both 0.19s; }
        .fu4 { animation: fadeUp 0.5s ease both 0.26s; }
        .fu5 { animation: fadeUp 0.5s ease both 0.33s; }
      `}</style>

      <div className="relative w-full overflow-hidden" style={{
        height: '28vh', minHeight: '160px', maxHeight: '220px',
        background: 'linear-gradient(180deg, #fce7f3 0%, #fdf2f8 55%, #fef7ff 80%, #f8fafc 100%)'
      }}>
        <div className="cloud-group cg1"><div className="cloud c1"/><div className="cloud c2"/></div>
        <div className="cloud-group cg2"><div className="cloud c1"/><div className="cloud c2"/></div>
        <div className="plane-wrap">
          <div className="plane-scia" />
          <img src="/aereo.svg" alt="" className="plane-svg" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: 'linear-gradient(to bottom, transparent, #f8fafc)' }} />
      </div>

      <div className="flex flex-col items-center bg-slate-50 px-6 pt-5 pb-10">
        <div className="w-full max-w-sm space-y-4">
          <Link href="/nubilato/voli" className="w-full block fu1">
            <button className="w-full bg-pink-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              ✈️ Voli & Logistica
            </button>
          </Link>
          <Link href="/nubilato/alloggio" className="w-full block fu2">
            <button className="w-full bg-fuchsia-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-fuchsia-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🏠 Alloggio
            </button>
          </Link>
          <Link href="/nubilato/attivita" className="w-full block fu3">
            <button className="w-full bg-rose-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🎉 Proponi Attività
            </button>
          </Link>
          <Link href="/nubilato/spese" className="w-full block fu4">
            <button className="w-full bg-amber-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              💰 Gestione Spese
            </button>
          </Link>
          <Link href="/scherzi" className="w-full block fu5">
            <button className="w-full bg-purple-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-purple-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              😈 Scherzi Matrimonio
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
