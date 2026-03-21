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
        const currentUrl = window.location.pathname + window.location.search;
        window.location.assign(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-slate-950 text-white">
      <style>{`
        /* ── STELLE ── */
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes twinkle2 {
          0%, 100% { opacity: 0.6; }
          60%       { opacity: 0.05; }
        }

        /* ── AURORA ── */
        @keyframes aurora1 {
          0%   { transform: translateX(-10%) scaleY(1) rotate(-2deg); opacity: 0.18; }
          33%  { transform: translateX(5%)  scaleY(1.3) rotate(1deg);  opacity: 0.28; }
          66%  { transform: translateX(-5%) scaleY(0.9) rotate(-1deg); opacity: 0.22; }
          100% { transform: translateX(-10%) scaleY(1) rotate(-2deg); opacity: 0.18; }
        }
        @keyframes aurora2 {
          0%   { transform: translateX(8%)  scaleY(0.8) rotate(1deg);  opacity: 0.12; }
          50%  { transform: translateX(-8%) scaleY(1.4) rotate(-2deg); opacity: 0.24; }
          100% { transform: translateX(8%)  scaleY(0.8) rotate(1deg);  opacity: 0.12; }
        }
        @keyframes aurora3 {
          0%   { transform: translateX(0%)  scaleY(1.1); opacity: 0.08; }
          40%  { transform: translateX(12%) scaleY(0.7); opacity: 0.2; }
          80%  { transform: translateX(-6%) scaleY(1.3); opacity: 0.14; }
          100% { transform: translateX(0%)  scaleY(1.1); opacity: 0.08; }
        }

        /* ── AEREO ── */
        @keyframes flight {
          0%   { transform: translate(-80px, 60px) rotate(-6deg); opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translate(calc(100vw + 80px), -20px) rotate(-6deg); opacity: 0; }
        }
        @keyframes contrail {
          0%   { opacity: 0; width: 0; }
          10%  { opacity: 0.5; }
          80%  { opacity: 0.3; }
          100% { opacity: 0; width: 180px; }
        }

        /* ── GLOW PULSANTE ── */
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3), 0 4px 24px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 0 40px rgba(59,130,246,0.5), 0 4px 24px rgba(0,0,0,0.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* stelle */
        .star { position: absolute; border-radius: 50%; background: white; }
        .s1  { width:2px; height:2px; top:8%;  left:12%; animation: twinkle  3.1s ease-in-out infinite; }
        .s2  { width:1px; height:1px; top:15%; left:30%; animation: twinkle2 2.4s ease-in-out infinite 0.5s; }
        .s3  { width:2px; height:2px; top:6%;  left:55%; animation: twinkle  4.2s ease-in-out infinite 1s; }
        .s4  { width:1px; height:1px; top:20%; left:72%; animation: twinkle2 3.8s ease-in-out infinite 0.3s; }
        .s5  { width:3px; height:3px; top:10%; left:85%; animation: twinkle  2.9s ease-in-out infinite 1.5s; }
        .s6  { width:1px; height:1px; top:28%; left:8%;  animation: twinkle2 4.5s ease-in-out infinite 0.8s; }
        .s7  { width:2px; height:2px; top:35%; left:45%; animation: twinkle  3.6s ease-in-out infinite 2s; }
        .s8  { width:1px; height:1px; top:5%;  left:92%; animation: twinkle2 2.7s ease-in-out infinite 1.2s; }
        .s9  { width:2px; height:2px; top:42%; left:22%; animation: twinkle  5s   ease-in-out infinite 0.2s; }
        .s10 { width:1px; height:1px; top:18%; left:65%; animation: twinkle2 3.3s ease-in-out infinite 1.8s; }
        .s11 { width:2px; height:2px; top:50%; left:78%; animation: twinkle  4.1s ease-in-out infinite 0.6s; }
        .s12 { width:1px; height:1px; top:32%; left:90%; animation: twinkle2 2.2s ease-in-out infinite 2.5s; }

        /* aurora */
        .aurora-wrap { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
        .aurora-1 {
          position: absolute;
          top: -20%; left: -20%; width: 140%; height: 65%;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(16,185,129,0.12) 30%,
            rgba(59,130,246,0.18) 55%,
            rgba(139,92,246,0.10) 75%,
            transparent 100%
          );
          filter: blur(40px);
          animation: aurora1 11s ease-in-out infinite;
        }
        .aurora-2 {
          position: absolute;
          top: -10%; left: -30%; width: 160%; height: 50%;
          background: linear-gradient(175deg,
            transparent 0%,
            rgba(6,182,212,0.10) 25%,
            rgba(99,102,241,0.14) 50%,
            rgba(16,185,129,0.08) 75%,
            transparent 100%
          );
          filter: blur(50px);
          animation: aurora2 15s ease-in-out infinite 2s;
        }
        .aurora-3 {
          position: absolute;
          top: 5%; left: -10%; width: 120%; height: 40%;
          background: linear-gradient(185deg,
            transparent 0%,
            rgba(236,72,153,0.06) 20%,
            rgba(59,130,246,0.10) 50%,
            rgba(16,185,129,0.06) 80%,
            transparent 100%
          );
          filter: blur(60px);
          animation: aurora3 19s ease-in-out infinite 1s;
        }

        /* aereo */
        .plane-container {
          position: absolute;
          top: 42%; left: 0;
          animation: flight 8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
          animation-delay: 1s;
        }
        .plane-emoji { font-size: 28px; line-height: 1; display: block; }
        .contrail {
          position: absolute;
          right: 100%; top: 50%;
          height: 2px;
          margin-right: 4px;
          transform: translateY(-50%);
          background: linear-gradient(to left, rgba(255,255,255,0.6), transparent);
          border-radius: 2px;
          animation: contrail 8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
          animation-delay: 1s;
        }

        /* orizzonte */
        .horizon {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 35%;
          background: linear-gradient(to top,
            rgba(15,23,42,1) 0%,
            rgba(15,23,42,0.85) 40%,
            transparent 100%
          );
        }
        /* skyline amsterdam stilizzata */
        .skyline {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 80px;
          overflow: hidden;
        }
        .skyline svg { width: 100%; height: 100%; }

        /* acqua riflessa */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .water {
          position: absolute;
          bottom: 0; left: 0; right: 0; height: 18px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(59,130,246,0.15) 20%,
            rgba(99,102,241,0.2) 50%,
            rgba(59,130,246,0.15) 80%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 4s linear infinite;
        }

        /* pulsanti */
        .btn-home {
          width: 100%;
          display: flex; align-items: center; gap: 12px;
          padding: 18px 20px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: -0.01em;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          color: white;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-home::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .btn-home:active { transform: scale(0.97); }
        .btn-home .icon { font-size: 22px; line-height: 1; }
        .btn-home .label { flex: 1; text-align: left; }
        .btn-home .arrow { opacity: 0.3; font-size: 18px; transition: opacity 0.2s, transform 0.2s; }
        .btn-home:active .arrow { opacity: 0.7; transform: translateX(3px); }

        .btn-voli     { background: linear-gradient(135deg, rgba(37,99,235,0.4), rgba(29,78,216,0.2)); border-color: rgba(59,130,246,0.3); }
        .btn-alloggio { background: linear-gradient(135deg, rgba(79,70,229,0.4), rgba(67,56,202,0.2)); border-color: rgba(99,102,241,0.3); }
        .btn-attivita { background: linear-gradient(135deg, rgba(5,150,105,0.4), rgba(4,120,87,0.2));  border-color: rgba(16,185,129,0.3); }
        .btn-spese    { background: linear-gradient(135deg, rgba(180,83,9,0.4),  rgba(146,64,14,0.2)); border-color: rgba(245,158,11,0.3); }
        .btn-scherzi  { background: linear-gradient(135deg, rgba(109,40,217,0.4),rgba(88,28,135,0.2)); border-color: rgba(139,92,246,0.3); }

        .fade-up-1 { animation: fadeUp 0.6s ease both 0.1s; }
        .fade-up-2 { animation: fadeUp 0.6s ease both 0.2s; }
        .fade-up-3 { animation: fadeUp 0.6s ease both 0.3s; }
        .fade-up-4 { animation: fadeUp 0.6s ease both 0.4s; }
        .fade-up-5 { animation: fadeUp 0.6s ease both 0.5s; }
      `}</style>

      {/* ── HERO VISUALE — edge-to-edge senza margini ── */}
      <div className="relative w-full" style={{ height: '42vh', minHeight: '220px', maxHeight: '340px' }}>

        {/* Cielo notturno gradient */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0f1f4a 0%, #060d1f 50%, #020508 100%)'
        }} />

        {/* Aurora boreale */}
        <div className="aurora-wrap">
          <div className="aurora-1" />
          <div className="aurora-2" />
          <div className="aurora-3" />
        </div>

        {/* Stelle */}
        <div className="star s1" /><div className="star s2" /><div className="star s3" />
        <div className="star s4" /><div className="star s5" /><div className="star s6" />
        <div className="star s7" /><div className="star s8" /><div className="star s9" />
        <div className="star s10" /><div className="star s11" /><div className="star s12" />

        {/* Aereo con scia */}
        <div className="plane-container">
          <div className="contrail" style={{ width: '120px' }} />
          <span className="plane-emoji">✈️</span>
        </div>

        {/* Skyline Amsterdam stilizzata */}
        <div className="skyline">
          <svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
            <path d="
              M0,80 L0,55 L8,55 L8,45 L10,42 L12,45 L12,50 L18,50 L18,40 L20,35 L22,40 L22,50
              L30,50 L30,55 L35,55 L35,48 L38,45 L41,48 L41,55
              L50,55 L50,42 L52,38 L52,32 L54,28 L56,32 L56,38 L58,42 L58,55
              L65,55 L65,50 L68,47 L71,50 L71,55
              L78,55 L78,45 L80,40 L82,45 L82,55
              L90,55 L90,48 L92,44 L94,48 L94,55
              L100,55 L100,52 L106,52 L106,42 L108,38 L108,28 L110,22 L112,28 L112,38 L114,42 L114,52 L120,52 L120,55
              L128,55 L128,48 L132,44 L136,48 L136,55
              L145,55 L145,50 L148,47 L151,50 L151,55
              L158,55 L158,42 L160,36 L162,42 L162,55
              L170,55 L170,52 L175,52 L175,45 L177,40 L179,45 L179,52 L184,52 L184,55
              L192,55 L192,48 L195,44 L198,48 L198,55
              L206,55 L206,52 L210,52 L210,44 L212,40 L212,32 L214,26 L216,32 L216,40 L218,44 L218,52 L222,52 L222,55
              L230,55 L230,50 L234,46 L238,50 L238,55
              L246,55 L246,48 L249,44 L252,48 L252,55
              L260,55 L260,42 L262,36 L264,42 L264,55
              L272,55 L272,50 L276,50 L276,42 L278,38 L280,42 L280,50 L284,50 L284,55
              L292,55 L292,48 L295,44 L298,48 L298,55
              L306,55 L306,42 L308,36 L308,26 L310,20 L312,26 L312,36 L314,42 L314,55
              L322,55 L322,50 L326,46 L330,50 L330,55
              L338,55 L338,48 L341,44 L344,48 L344,55
              L352,55 L352,50 L358,50 L358,42 L360,38 L362,42 L362,50 L368,50 L368,55
              L376,55 L376,48 L380,44 L384,48 L384,55
              L392,55 L392,50 L396,50 L400,50 L400,80 Z
            " fill="rgba(15,23,42,0.95)" />
            {/* Finestrine illuminate */}
            <rect x="109" y="30" width="2" height="2" fill="rgba(251,191,36,0.6)" rx="0.5" />
            <rect x="213" y="34" width="2" height="2" fill="rgba(251,191,36,0.5)" rx="0.5" />
            <rect x="309" y="28" width="2" height="2" fill="rgba(251,191,36,0.7)" rx="0.5" />
            <rect x="53"  y="36" width="2" height="2" fill="rgba(251,191,36,0.4)" rx="0.5" />
          </svg>
        </div>

        {/* Acqua riflessa */}
        <div className="water" />

        {/* Gradient fade verso il basso per unirsi ai pulsanti */}
        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{ background: 'linear-gradient(to bottom, transparent, #020508)' }} />
      </div>

      {/* ── PULSANTI ── */}
      <div className="flex-1 px-5 pt-5 pb-10 space-y-3" style={{ background: '#020508' }}>
        <Link href="/voli" className="block fade-up-1">
          <button className="btn-home btn-voli">
            <span className="icon">✈️</span>
            <span className="label">Voli & Logistica</span>
            <span className="arrow">›</span>
          </button>
        </Link>
        <Link href="/alloggio" className="block fade-up-2">
          <button className="btn-home btn-alloggio">
            <span className="icon">🏠</span>
            <span className="label">Alloggio</span>
            <span className="arrow">›</span>
          </button>
        </Link>
        <Link href="/attivita" className="block fade-up-3">
          <button className="btn-home btn-attivita">
            <span className="icon">🎉</span>
            <span className="label">Proponi Attività</span>
            <span className="arrow">›</span>
          </button>
        </Link>
        <Link href="/spese" className="block fade-up-4">
          <button className="btn-home btn-spese">
            <span className="icon">💰</span>
            <span className="label">Gestione Spese</span>
            <span className="arrow">›</span>
          </button>
        </Link>
        <Link href="/scherzi" className="block fade-up-5">
          <button className="btn-home btn-scherzi">
            <span className="icon">😈</span>
            <span className="label">Scherzi Matrimonio</span>
            <span className="arrow">›</span>
          </button>
        </Link>
      </div>
    </main>
  );
}