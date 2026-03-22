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
        window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const { data: profilo } = await supabase
        .from('profili')
        .select('primo_accesso')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profilo?.primo_accesso === true) {
        window.location.assign('/setup-account');
      } else {
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
    <main className="flex flex-col min-h-screen bg-slate-50">
      <style>{`
        /* ── NUVOLE ── */
        @keyframes drift1 { 0% { transform: translateX(-8%); } 50% { transform: translateX(4%); } 100% { transform: translateX(-8%); } }
        @keyframes drift2 { 0% { transform: translateX(6%); } 50% { transform: translateX(-5%); } 100% { transform: translateX(6%); } }
        @keyframes drift3 { 0% { transform: translateX(-4%); } 50% { transform: translateX(7%); } 100% { transform: translateX(-4%); } }
        @keyframes drift4 { 0% { transform: translateX(3%); } 50% { transform: translateX(-6%); } 100% { transform: translateX(3%); } }

        /* ── AEREO ── */
        @keyframes fly {
          0%   { transform: translate(-80px, 0px) rotate(-4deg); opacity: 0; }
          6%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate(calc(100vw + 80px), -14px) rotate(-4deg); opacity: 0; }
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
        .cg1 .c3 { width:50px; height:36px; top:6px; left:44px; background: rgba(255,255,255,0.9); border-radius:50%; filter:blur(2px); }

        .cg2 { top: 8%; left: 28%; animation: drift2 28s ease-in-out infinite 4s; }
        .cg2 .c1 { width:130px; height:44px; top:22px; left:0; background: rgba(255,255,255,0.88); border-radius:60px; filter:blur(3px); }
        .cg2 .c2 { width:80px; height:60px; top:0; left:22px; background: rgba(255,255,255,0.95); border-radius:50%; filter:blur(1px); }
        .cg2 .c3 { width:70px; height:50px; top:8px; left:60px; background: rgba(255,255,255,0.9); border-radius:50%; filter:blur(2px); }
        .cg2 .c4 { width:55px; height:40px; top:14px; left:90px; background: rgba(219,234,254,0.7); border-radius:50%; filter:blur(3px); }

        .cg3 { top: 22%; right: -8%; animation: drift3 19s ease-in-out infinite 8s; }
        .cg3 .c1 { width:100px; height:38px; top:18px; left:0; background: rgba(255,255,255,0.85); border-radius:50px; filter:blur(2px); }
        .cg3 .c2 { width:65px; height:50px; top:0; left:16px; background: rgba(255,255,255,0.92); border-radius:50%; filter:blur(1px); }
        .cg3 .c3 { width:55px; height:40px; top:8px; left:48px; background: rgba(219,234,254,0.75); border-radius:50%; filter:blur(2px); }

        .cg4 { top: 38%; left: 5%; animation: drift4 25s ease-in-out infinite 12s; }
        .cg4 .c1 { width:70px; height:28px; top:14px; left:0; background: rgba(255,255,255,0.8); border-radius:40px; filter:blur(3px); }
        .cg4 .c2 { width:50px; height:38px; top:0; left:12px; background: rgba(255,255,255,0.88); border-radius:50%; filter:blur(2px); }

        .cg5 { top: 5%; left: 55%; animation: drift1 32s ease-in-out infinite 16s; }
        .cg5 .c1 { width:60px; height:22px; top:12px; left:0; background: rgba(255,255,255,0.75); border-radius:40px; filter:blur(2px); }
        .cg5 .c2 { width:42px; height:32px; top:0; left:10px; background: rgba(255,255,255,0.85); border-radius:50%; filter:blur(1px); }

        /* aereo emoji */
        .plane-wrap {
          position: absolute;
          top: 30%; left: 0;
          animation: fly 9s linear infinite 0.5s;
          display: flex; align-items: center;
          font-size: 36px;
        }
        .plane-scia {
          width: 80px; height: 2px;
          background: linear-gradient(to left, rgba(148,163,184,0.5), transparent);
          border-radius: 2px;
          margin-right: 4px;
          animation: scia 9s linear infinite 0.5s;
        }

        /* skyline + acqua */
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes mulino {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .windmill-blade { transform-origin: 50% 50%; animation: mulino 8s linear infinite; }
        .water {
          position: absolute; bottom: 0; left: 0; right: 0; height: 18px;
          background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.15) 20%, rgba(99,102,241,0.2) 50%, rgba(59,130,246,0.15) 80%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 4s linear infinite;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu1 { animation: fadeUp 0.5s ease both 0.05s; }
        .fu2 { animation: fadeUp 0.5s ease both 0.12s; }
        .fu3 { animation: fadeUp 0.5s ease both 0.19s; }
        .fu4 { animation: fadeUp 0.5s ease both 0.26s; }
        .fu5 { animation: fadeUp 0.5s ease both 0.33s; }
      `}</style>

      {/* ── HERO CIELO ── */}
      <div className="relative w-full overflow-hidden" style={{
        height: '28vh', minHeight: '160px', maxHeight: '220px',
        background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 55%, #f0f9ff 80%, #f8fafc 100%)'
      }}>
        {/* Nuvole */}
        <div className="cloud-group cg1"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/></div>
        <div className="cloud-group cg2"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/><div className="cloud c4"/></div>
        <div className="cloud-group cg3"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/></div>
        <div className="cloud-group cg4"><div className="cloud c1"/><div className="cloud c2"/></div>
        <div className="cloud-group cg5"><div className="cloud c1"/><div className="cloud c2"/></div>

        {/* Aereo emoji */}
        <div className="plane-wrap">
          <div className="plane-scia" />
          ✈️
        </div>

        {/* Skyline Amsterdam */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 400 68" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet" style={{ display:'block', width:'100%', height:'68px' }}>
            <g fill="#cbd5e1" opacity="0.6">
              <rect x="0" y="44" width="22" height="24" rx="1"/>
              <polygon points="0,44 11,32 22,44"/>
              <rect x="25" y="40" width="18" height="28" rx="1"/>
              <polygon points="25,40 34,26 43,40"/>
              <rect x="46" y="46" width="20" height="22" rx="1"/>
              <polygon points="46,46 56,35 66,46"/>
              <rect x="52" y="50" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.9"/>
              <rect x="70" y="28" width="16" height="40" rx="1"/>
              <polygon points="70,28 78,14 86,28"/>
              <rect x="75" y="42" width="6" height="8" rx="0.5" fill="#93c5fd" opacity="0.7"/>
              <rect x="90" y="44" width="22" height="24" rx="1"/>
              <polygon points="90,44 101,30 112,44"/>
              <rect x="116" y="40" width="18" height="28" rx="1"/>
              <polygon points="116,40 125,27 134,40"/>
              <rect x="148" y="36" width="12" height="32" rx="1"/>
              <polygon points="144,68 152,54 160,68" fill="#cbd5e1" opacity="0.6"/>
              <g className="windmill-blade" style={{transformOrigin: '154px 44px'}}>
                <line x1="154" y1="44" x2="154" y2="28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="154" y1="44" x2="168" y2="44" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="154" y1="44" x2="154" y2="60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="154" y1="44" x2="140" y2="44" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
              <circle cx="154" cy="44" r="3" fill="#64748b"/>
              <rect x="168" y="42" width="20" height="26" rx="1"/>
              <polygon points="168,42 178,28 188,42"/>
              <rect x="192" y="46" width="18" height="22" rx="1"/>
              <polygon points="192,46 201,34 210,46"/>
              <rect x="197" y="50" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.9"/>
              <rect x="215" y="24" width="14" height="44" rx="1"/>
              <polygon points="215,24 222,10 229,24"/>
              <rect x="233" y="44" width="22" height="24" rx="1"/>
              <polygon points="233,44 244,30 255,44"/>
              <rect x="258" y="40" width="18" height="28" rx="1"/>
              <polygon points="258,40 267,27 276,40"/>
              <rect x="280" y="46" width="20" height="22" rx="1"/>
              <polygon points="280,46 290,34 300,46"/>
              <rect x="304" y="38" width="22" height="30" rx="1"/>
              <polygon points="304,38 315,24 326,38"/>
              <rect x="310" y="48" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.9"/>
              <rect x="330" y="44" width="18" height="24" rx="1"/>
              <polygon points="330,44 339,31 348,44"/>
              <rect x="352" y="40" width="20" height="28" rx="1"/>
              <polygon points="352,40 362,27 372,40"/>
              <rect x="376" y="46" width="24" height="22" rx="1"/>
              <polygon points="376,46 388,33 400,46"/>
            </g>
            <rect x="0" y="60" width="400" height="8" fill="#bfdbfe" opacity="0.55"/>
            <path d="M0,62 Q50,60 100,62 Q150,64 200,62 Q250,60 300,62 Q350,64 400,62" stroke="white" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <g>
              {[12,24,36,48,60,72,84].map((x: number, i: number) => (
                <g key={x}>
                  <line x1={x} y1="68" x2={x} y2="58" stroke="#86efac" strokeWidth="1.5"/>
                  <ellipse cx={x} cy="57" rx="4" ry="5" fill={['#f87171','#fb923c','#facc15','#f472b6','#c084fc','#34d399','#60a5fa'][i % 7]} opacity="0.85"/>
                </g>
              ))}
              {[96,110,124,138,152,166,180,194,208,222,236,250,264,278,292,306,320,334,348,362,376,390].map((x: number, i: number) => (
                <g key={x}>
                  <line x1={x} y1="68" x2={x} y2="60" stroke="#86efac" strokeWidth="1.2"/>
                  <ellipse cx={x} cy="59" rx="3" ry="4" fill={['#f87171','#facc15','#c084fc','#34d399','#fb923c','#60a5fa','#f472b6'][i % 7]} opacity="0.75"/>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Wave transizione */}
        <div className="absolute bottom-0 left-0 right-0 h-4"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8fafc)' }} />
      </div>

      {/* ── PULSANTI — originali ── */}
      <div className="flex flex-col items-center bg-slate-50 px-6 pt-5 pb-10">
        <div className="w-full max-w-sm space-y-4">
          <Link href="/voli" className="w-full block fu1">
            <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              ✈️ Voli & Logistica
            </button>
          </Link>
          <Link href="/alloggio" className="w-full block fu2">
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🏠 Alloggio
            </button>
          </Link>
          <Link href="/attivita" className="w-full block fu3">
            <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3">
              🎉 Proponi Attività
            </button>
          </Link>
          <Link href="/spese" className="w-full block fu4">
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