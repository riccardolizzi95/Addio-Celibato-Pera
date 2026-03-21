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
      if (!profilo || profilo.primo_accesso === true) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">
      <style>{`

        /* ── CIELO ── */
        @keyframes drift1 {
          0%   { transform: translateX(-8%) scaleX(1); }
          50%  { transform: translateX(4%)  scaleX(1.04); }
          100% { transform: translateX(-8%) scaleX(1); }
        }
        @keyframes drift2 {
          0%   { transform: translateX(6%)  scaleX(1); }
          50%  { transform: translateX(-5%) scaleX(1.06); }
          100% { transform: translateX(6%)  scaleX(1); }
        }
        @keyframes drift3 {
          0%   { transform: translateX(-4%) scaleX(1.02); }
          50%  { transform: translateX(7%)  scaleX(1); }
          100% { transform: translateX(-4%) scaleX(1.02); }
        }
        @keyframes drift4 {
          0%   { transform: translateX(3%)  scaleX(1); }
          50%  { transform: translateX(-6%) scaleX(1.03); }
          100% { transform: translateX(3%)  scaleX(1); }
        }

        /* ── AEREO ── */
        @keyframes fly {
          0%   { transform: translate(-60px, 0px) rotate(-4deg); opacity: 0; }
          6%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate(calc(100vw + 60px), -12px) rotate(-4deg); opacity: 0; }
        }
        @keyframes scia {
          0%   { opacity: 0; width: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 0.4; }
          100% { opacity: 0; }
        }

        /* ── TULIPANI ── */
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50%       { transform: rotate(2deg)  translateY(-1px); }
        }
        @keyframes sway2 {
          0%, 100% { transform: rotate(1.5deg) translateY(0); }
          50%       { transform: rotate(-2.5deg) translateY(-1px); }
        }

        /* ── MULINO ── */
        @keyframes mulino {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── WATER ── */
        @keyframes ondulazione {
          0%, 100% { d: path("M0,4 Q30,0 60,4 Q90,8 120,4 Q150,0 180,4 Q210,8 240,4 Q270,0 300,4 Q330,8 360,4 Q390,0 400,4 L400,12 L0,12 Z"); }
          50%       { d: path("M0,8 Q30,4 60,8 Q90,12 120,8 Q150,4 180,8 Q210,12 240,8 Q270,4 300,8 Q330,12 360,8 Q390,4 400,8 L400,12 L0,12 Z"); }
        }

        /* ── PULSANTI ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cloud {
          position: absolute;
          border-radius: 50%;
          background: white;
          filter: blur(0px);
        }
        .cloud-group { position: absolute; }

        /* Nuvola 1 */
        .cg1 { top: 18%; left: -5%; animation: drift1 22s ease-in-out infinite; }
        .cg1 .c1 { width:90px; height:36px; top:16px; left:0; background: rgba(255,255,255,0.92); border-radius:50px; filter:blur(2px); }
        .cg1 .c2 { width:60px; height:44px; top:0;   left:18px; background: rgba(255,255,255,0.95); border-radius:50%; filter:blur(1px); }
        .cg1 .c3 { width:50px; height:36px; top:6px; left:44px; background: rgba(255,255,255,0.9);  border-radius:50%; filter:blur(2px); }

        /* Nuvola 2 — più grande, centro */
        .cg2 { top: 8%; left: 28%; animation: drift2 28s ease-in-out infinite 4s; }
        .cg2 .c1 { width:130px; height:44px; top:22px; left:0; background: rgba(255,255,255,0.88); border-radius:60px; filter:blur(3px); }
        .cg2 .c2 { width:80px;  height:60px; top:0;    left:22px; background: rgba(255,255,255,0.95); border-radius:50%; filter:blur(1px); }
        .cg2 .c3 { width:70px;  height:50px; top:8px;  left:60px; background: rgba(255,255,255,0.9);  border-radius:50%; filter:blur(2px); }
        .cg2 .c4 { width:55px;  height:40px; top:14px; left:90px; background: rgba(219,234,254,0.7);  border-radius:50%; filter:blur(3px); }

        /* Nuvola 3 — destra */
        .cg3 { top: 22%; right: -8%; animation: drift3 19s ease-in-out infinite 8s; }
        .cg3 .c1 { width:100px; height:38px; top:18px; left:0;    background: rgba(255,255,255,0.85); border-radius:50px; filter:blur(2px); }
        .cg3 .c2 { width:65px;  height:50px; top:0;    left:16px; background: rgba(255,255,255,0.92); border-radius:50%; filter:blur(1px); }
        .cg3 .c3 { width:55px;  height:40px; top:8px;  left:48px; background: rgba(219,234,254,0.75); border-radius:50%; filter:blur(2px); }

        /* Nuvola 4 — piccola sinistra */
        .cg4 { top: 38%; left: 5%; animation: drift4 25s ease-in-out infinite 12s; }
        .cg4 .c1 { width:70px;  height:28px; top:14px; left:0;    background: rgba(255,255,255,0.8);  border-radius:40px; filter:blur(3px); }
        .cg4 .c2 { width:50px;  height:38px; top:0;    left:12px; background: rgba(255,255,255,0.88); border-radius:50%; filter:blur(2px); }

        /* Nuvola 5 — piccola centro-dx */
        .cg5 { top: 5%; left: 55%; animation: drift1 32s ease-in-out infinite 16s; }
        .cg5 .c1 { width:60px;  height:22px; top:12px; left:0;    background: rgba(255,255,255,0.75); border-radius:40px; filter:blur(2px); }
        .cg5 .c2 { width:42px;  height:32px; top:0;    left:10px; background: rgba(255,255,255,0.85); border-radius:50%; filter:blur(1px); }

        /* aereo SVG */
        .plane-wrap {
          position: absolute;
          top: 28%; left: 0;
          animation: fly 10s linear infinite 2s;
          display: flex; align-items: center;
        }
        .plane-scia {
          height: 1.5px;
          background: linear-gradient(to left, rgba(148,163,184,0.55), transparent);
          border-radius: 2px;
          margin-right: 2px;
          animation: scia 10s linear infinite 2s;
        }

        /* tulipani */
        .tulip { display: inline-block; font-size: 20px; }
        .tulip:nth-child(odd)  { animation: sway  3.2s ease-in-out infinite; }
        .tulip:nth-child(even) { animation: sway2 2.8s ease-in-out infinite 0.4s; }

        /* mulino */
        .windmill-blade {
          transform-origin: 50% 50%;
          animation: mulino 8s linear infinite;
        }

        /* acqua canale */
        .canal-wave {
          animation: ondulazione 3s ease-in-out infinite;
        }

        /* pulsanti home */
        .btn-home {
          width: 100%;
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          border-radius: 18px;
          font-weight: 800; font-size: 15px;
          letter-spacing: -0.01em;
          color: white;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative; overflow: hidden;
        }
        .btn-home::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .btn-home:active { transform: scale(0.97); }
        .btn-home .lbl { flex: 1; text-align: left; }
        .btn-home .arr { opacity: 0.5; font-size: 20px; font-weight: 300; }

        .fu1 { animation: fadeUp 0.5s ease both 0.05s; }
        .fu2 { animation: fadeUp 0.5s ease both 0.12s; }
        .fu3 { animation: fadeUp 0.5s ease both 0.19s; }
        .fu4 { animation: fadeUp 0.5s ease both 0.26s; }
        .fu5 { animation: fadeUp 0.5s ease both 0.33s; }
      `}</style>

      {/* ── HERO CIELO ── edge-to-edge, altezza contenuta */}
      <div className="relative w-full overflow-hidden" style={{
        height: '28vh',
        minHeight: '160px',
        maxHeight: '220px',
        background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 55%, #f0f9ff 80%, #f8fafc 100%)'
      }}>

        {/* Nuvole */}
        <div className="cloud-group cg1"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/></div>
        <div className="cloud-group cg2"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/><div className="cloud c4"/></div>
        <div className="cloud-group cg3"><div className="cloud c1"/><div className="cloud c2"/><div className="cloud c3"/></div>
        <div className="cloud-group cg4"><div className="cloud c1"/><div className="cloud c2"/></div>
        <div className="cloud-group cg5"><div className="cloud c1"/><div className="cloud c2"/></div>

        {/* Aereo SVG — stesso stile della skyline */}
        <div className="plane-wrap">
          <div className="plane-scia" style={{ width: "90px" }} />
          <svg width="38" height="22" viewBox="0 0 38 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="19" cy="11" rx="17" ry="3.8" fill="#94a3b8" opacity="0.82"/>
            <path d="M36 11 L38 11 L35 8.5 Z" fill="#64748b" opacity="0.9"/>
            <path d="M17 11 L26 3 L28 4.5 L21 11 Z" fill="#94a3b8" opacity="0.78"/>
            <path d="M17 11 L26 19 L28 17.5 L21 11 Z" fill="#94a3b8" opacity="0.78"/>
            <path d="M4 11 L2 7 L6 8 L7 11 Z" fill="#94a3b8" opacity="0.72"/>
            <path d="M4 11 L2 15 L6 14 L7 11 Z" fill="#94a3b8" opacity="0.72"/>
            <path d="M4 11 L3 5.5 L7 8 L7 11 Z" fill="#64748b" opacity="0.65"/>
            <rect x="15" y="9.5" width="2.2" height="1.6" rx="0.5" fill="white" opacity="0.5"/>
            <rect x="19" y="9.5" width="2.2" height="1.6" rx="0.5" fill="white" opacity="0.45"/>
            <rect x="23" y="9.5" width="2.2" height="1.6" rx="0.5" fill="white" opacity="0.4"/>
            <ellipse cx="23" cy="12.8" rx="3.2" ry="1.3" fill="#64748b" opacity="0.68"/>
            <ellipse cx="23" cy="9.2"  rx="3.2" ry="1.3" fill="#64748b" opacity="0.68"/>
          </svg>
        </div>

        {/* Skyline Amsterdam — SVG inline, in basso */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 400 68" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet" style={{ display:'block', width:'100%', height:'68px' }}>

            {/* Case olandesi + mulino */}
            <g fill="#cbd5e1" opacity="0.6">
              {/* fila case */}
              <rect x="0"   y="44" width="22" height="24" rx="1"/>
              <polygon points="0,44 11,32 22,44"/>

              <rect x="25"  y="40" width="18" height="28" rx="1"/>
              <polygon points="25,40 34,26 43,40"/>

              <rect x="46"  y="46" width="20" height="22" rx="1"/>
              <polygon points="46,46 56,35 66,46"/>
              {/* finestrella */}
              <rect x="52" y="50" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.9"/>

              {/* torre/campanile */}
              <rect x="70"  y="28" width="16" height="40" rx="1"/>
              <polygon points="70,28 78,14 86,28"/>
              <rect x="75" y="42" width="6" height="8" rx="0.5" fill="#93c5fd" opacity="0.7"/>

              <rect x="90"  y="44" width="22" height="24" rx="1"/>
              <polygon points="90,44 101,30 112,44"/>

              <rect x="116" y="40" width="18" height="28" rx="1"/>
              <polygon points="116,40 125,27 134,40"/>

              {/* mulino a vento */}
              <rect x="148" y="36" width="12" height="32" rx="1"/>
              {/* base mulino */}
              <polygon points="144,68 152,54 160,68" fill="#cbd5e1" opacity="0.6"/>
              {/* pale */}
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

              {/* altro campanile */}
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

            {/* Canale — sottile striscia azzurra */}
            <rect x="0" y="60" width="400" height="8" fill="#bfdbfe" opacity="0.55" rx="0"/>
            {/* ondine */}
            <path d="M0,62 Q50,60 100,62 Q150,64 200,62 Q250,60 300,62 Q350,64 400,62"
              stroke="white" strokeWidth="1.2" fill="none" opacity="0.6"/>

            {/* tulipani — fila in primo piano */}
            <g>
              {[12,24,36,48,60,72,84].map((x, i) => (
                <g key={x}>
                  <line x1={x} y1="68" x2={x} y2="58" stroke="#86efac" strokeWidth="1.5"/>
                  <ellipse cx={x} cy="57" rx="4" ry="5"
                    fill={['#f87171','#fb923c','#facc15','#f472b6','#c084fc','#34d399','#60a5fa'][i % 7]}
                    opacity="0.85"/>
                </g>
              ))}
              {[96,110,124,138,152,166,180,194,208,222,236,250,264,278,292,306,320,334,348,362,376,390].map((x, i) => (
                <g key={x}>
                  <line x1={x} y1="68" x2={x} y2="60" stroke="#86efac" strokeWidth="1.2"/>
                  <ellipse cx={x} cy="59" rx="3" ry="4"
                    fill={['#f87171','#facc15','#c084fc','#34d399','#fb923c','#60a5fa','#f472b6'][i % 7]}
                    opacity="0.75"/>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* ── WAVE di transizione ── */}
      <div style={{ background: '#f8fafc', marginTop: '-2px' }}>
        <svg viewBox="0 0 400 28" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" style={{ display:'block', width:'100%', height:'28px' }}>
          <path d="M0,0 Q50,20 100,10 Q150,0 200,14 Q250,28 300,12 Q350,0 400,16 L400,0 Z"
            fill="#f0f9ff"/>
          <path d="M0,4 Q60,22 120,12 Q180,2 240,18 Q300,28 360,14 Q390,8 400,20 L400,4 Z"
            fill="#eff6ff" opacity="0.7"/>
        </svg>
      </div>

      {/* ── PULSANTI ── */}
      <div className="flex-1 px-5 pt-3 pb-10 space-y-3" style={{ background: '#f8fafc' }}>
        <Link href="/voli" className="block fu1">
          <button className="btn-home" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}>
            <span style={{fontSize:'22px'}}>✈️</span>
            <span className="lbl">Voli & Logistica</span>
            <span className="arr">›</span>
          </button>
        </Link>
        <Link href="/alloggio" className="block fu2">
          <button className="btn-home" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', boxShadow: '0 4px 20px rgba(79,70,229,0.35)' }}>
            <span style={{fontSize:'22px'}}>🏠</span>
            <span className="lbl">Alloggio</span>
            <span className="arr">›</span>
          </button>
        </Link>
        <Link href="/attivita" className="block fu3">
          <button className="btn-home" style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 20px rgba(5,150,105,0.35)' }}>
            <span style={{fontSize:'22px'}}>🎉</span>
            <span className="lbl">Proponi Attività</span>
            <span className="arr">›</span>
          </button>
        </Link>
        <Link href="/spese" className="block fu4">
          <button className="btn-home" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 20px rgba(217,119,6,0.35)' }}>
            <span style={{fontSize:'22px'}}>💰</span>
            <span className="lbl">Gestione Spese</span>
            <span className="arr">›</span>
          </button>
        </Link>
        <Link href="/scherzi" className="block fu5">
          <button className="btn-home" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
            <span style={{fontSize:'22px'}}>😈</span>
            <span className="lbl">Scherzi Matrimonio</span>
            <span className="arr">›</span>
          </button>
        </Link>
      </div>
    </main>
  );
}