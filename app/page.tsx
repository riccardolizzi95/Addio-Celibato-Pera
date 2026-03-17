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
        {/* Aereo animato che decolla */}
        <div className="relative w-full h-28 mb-6 overflow-hidden">
          <style>{`
            @keyframes takeoff {
              0%   { transform: translate(-60px, 20px) rotate(0deg); opacity: 0; }
              15%  { opacity: 1; }
              60%  { transform: translate(120px, 0px) rotate(-8deg); opacity: 1; }
              85%  { transform: translate(260px, -30px) rotate(-18deg); opacity: 0.7; }
              100% { transform: translate(340px, -60px) rotate(-22deg); opacity: 0; }
            }
            @keyframes trail {
              0%   { width: 0px; opacity: 0; left: -20px; }
              15%  { opacity: 0.5; }
              60%  { width: 90px; opacity: 0.3; left: 60px; }
              85%  { width: 60px; opacity: 0.15; left: 200px; }
              100% { width: 0px; opacity: 0; left: 280px; }
            }
            @keyframes clouds {
              0%   { transform: translateX(0px); }
              100% { transform: translateX(-120px); }
            }
            .plane-anim {
              animation: takeoff 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              animation-delay: 0.5s;
            }
            .trail-anim {
              animation: trail 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              animation-delay: 0.5s;
            }
            .cloud-anim {
              animation: clouds 6s linear infinite;
            }
            .cloud-anim-slow {
              animation: clouds 9s linear infinite;
            }
          `}</style>

          {/* Pista / linea orizzonte */}
          <div className="absolute bottom-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Nuvoline di sfondo */}
          <div className="cloud-anim absolute top-4 left-8 text-2xl opacity-30">☁️</div>
          <div className="cloud-anim-slow absolute top-2 left-48 text-xl opacity-20">☁️</div>
          <div className="cloud-anim absolute top-6 left-80 text-lg opacity-25">☁️</div>

          {/* Scia */}
          <div className="trail-anim absolute top-[46px] h-[3px] rounded-full"
            style={{ background: 'linear-gradient(to left, transparent, rgba(147,197,253,0.6))' }} />

          {/* Aereo */}
          <div className="plane-anim absolute top-8 left-0 text-5xl select-none">✈️</div>
        </div>

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