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

        {/* Skyline Barcellona */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 400 68" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet" style={{ display:'block', width:'100%', height:'68px' }}>
            <g fill="#f9a8d4" opacity="0.5">
              {/* Edifici bassi a sinistra */}
              <rect x="0" y="48" width="20" height="20" rx="1"/>
              <rect x="22" y="44" width="16" height="24" rx="1"/>
              <rect x="40" y="50" width="18" height="18" rx="1"/>
              {/* Torre Agbar */}
              <ellipse cx="72" cy="46" rx="7" ry="22" />
              <rect x="65" y="46" width="14" height="22" rx="1"/>
              {/* Edifici centrali */}
              <rect x="84" y="42" width="20" height="26" rx="1"/>
              <rect x="106" y="46" width="16" height="22" rx="1"/>
              <rect x="124" y="40" width="18" height="28" rx="1"/>
              {/* Sagrada Familia */}
              <rect x="152" y="30" width="20" height="38" rx="1"/>
              <polygon points="155,30 158,8 161,30"/>
              <polygon points="163,30 166,12 169,30"/>
              <rect x="156" y="34" width="4" height="6" rx="1" fill="#f472b6" opacity="0.8"/>
              <rect x="164" y="34" width="4" height="6" rx="1" fill="#f472b6" opacity="0.8"/>
              <circle cx="162" cy="40" r="4" fill="#f472b6" opacity="0.6"/>
              {/* Edifici dopo Sagrada */}
              <rect x="180" y="44" width="22" height="24" rx="1"/>
              <rect x="204" y="48" width="16" height="20" rx="1"/>
              <rect x="222" y="42" width="20" height="26" rx="1"/>
              {/* Hotel W / Torre a vela */}
              <path d="M255,46 Q262,20 269,46 Z" />
              <rect x="255" y="46" width="14" height="22" rx="1"/>
              {/* Palme e Barceloneta */}
              <rect x="278" y="50" width="18" height="18" rx="1"/>
              <rect x="298" y="46" width="14" height="22" rx="1"/>
              {/* Montjuïc / Castello */}
              <rect x="318" y="42" width="24" height="26" rx="1"/>
              <rect x="324" y="36" width="12" height="6" rx="1"/>
              <rect x="328" y="28" width="4" height="8"/>
              {/* Edifici a destra */}
              <rect x="346" y="48" width="18" height="20" rx="1"/>
              <rect x="366" y="44" width="16" height="24" rx="1"/>
              <rect x="384" y="50" width="16" height="18" rx="1"/>
            </g>
            {/* Mare / spiaggia */}
            <rect x="0" y="62" width="400" height="6" fill="#93c5fd" opacity="0.35"/>
            <path d="M0,63 Q30,61 60,63 Q90,65 120,63 Q150,61 180,63 Q210,65 240,63 Q270,61 300,63 Q330,65 360,63 Q390,61 400,63" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
            {/* Palme lungo la spiaggia */}
            <g>
              {[20,80,150,250,320,380].map((x: number, i: number) => (
                <g key={x}>
                  <line x1={x} y1="68" x2={x} y2="58" stroke="#86efac" strokeWidth="1.8"/>
                  <ellipse cx={x-3} cy="56" rx="5" ry="3" fill="#34d399" opacity="0.7" transform={`rotate(-20 ${x-3} 56)`}/>
                  <ellipse cx={x+3} cy="56" rx="5" ry="3" fill="#34d399" opacity="0.7" transform={`rotate(20 ${x+3} 56)`}/>
                </g>
              ))}
            </g>
          </svg>
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