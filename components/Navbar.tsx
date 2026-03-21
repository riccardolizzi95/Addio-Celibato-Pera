'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Eye, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  // La navbar è trasparente solo sulla home, opaca sulle altre pagine
  const isHome = pathname === '/';

  useEffect(() => {
    const initPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        const { data: profilo } = await supabase
          .from('profili')
          .select('username')
          .eq('id', session.user.id)
          .single();

        const channel = supabase.channel('global-presence', {
          config: { presence: { key: 'user' } }
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const names = Object.values(state)
              .flat()
              .map((u: any) => u.user_name);
            setOnlineUsers([...new Set(names)]);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                user_name: profilo?.username || session.user.email,
                online_at: new Date().toISOString()
              });
            }
          });

        return () => { channel.unsubscribe(); };
      }
    };
    initPresence();
  }, []);

  return (
    <nav
      className="flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-300"
      style={{
        // Home: trasparente sul cielo azzurro, fonde con l'hero
        // Altre pagine: bianco con ombra leggera
        background: isHome
          ? 'linear-gradient(to bottom, rgba(219,234,254,0.85) 0%, rgba(239,246,255,0.6) 100%)'
          : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isHome
          ? '1px solid rgba(147,197,253,0.2)'
          : '1px solid rgba(226,232,240,0.8)',
        boxShadow: isHome
          ? 'none'
          : '0 1px 12px rgba(0,0,0,0.06)',
        paddingTop: '10px',
        paddingBottom: '10px',
      }}
    >
      {/* SINISTRA: Verbali + Logo */}
      <div className="flex items-center gap-3">
        <Link
          href="/minute"
          title="Verbali Incontri"
          className="transition-all duration-200 rounded-xl p-2"
          style={{
            color: isHome ? 'rgba(71,85,105,0.7)' : '#64748b',
          }}
        >
          <ClipboardList size={22} />
        </Link>

        <Link
          href="/"
          className="font-black tracking-tight text-base transition-colors duration-200"
          style={{ color: isHome ? '#1e40af' : '#2563eb' }}
        >
          Missione Pera 🍐
        </Link>
      </div>

      {/* DESTRA: Online + Profilo */}
      <div className="flex items-center gap-2.5">
        {onlineUsers.length >= 2 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"
            style={{
              background: 'rgba(209,250,229,0.8)',
              color: '#059669',
              border: '1px solid rgba(167,243,208,0.6)',
            }}
          >
            <Eye size={13} />
            <span>{onlineUsers.length} online</span>
          </div>
        )}

        <Link href="/profilo">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: isHome
                ? 'rgba(255,255,255,0.6)'
                : 'rgba(241,245,249,1)',
              border: isHome
                ? '1px solid rgba(147,197,253,0.4)'
                : '1px solid rgba(203,213,225,0.8)',
              color: '#64748b',
              backdropFilter: 'blur(8px)',
            }}
          >
            <User size={18} />
          </div>
        </Link>
      </div>
    </nav>
  );
}