'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Eye, ClipboardList, Shield, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  // Nascondi la navbar su login e setup-account
  if (pathname === '/login' || pathname === '/setup-account' || pathname === '/auth/callback') return null;

  const isNub = pathname?.startsWith('/nubilato');

  useEffect(() => {
    const initPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profilo } = await supabase
          .from('profili')
          .select('username, admin, gruppo')
          .eq('id', session.user.id)
          .single();

        if (profilo?.admin) setIsAdmin(true);

        // Aggiorna ultimo_accesso
        await supabase
          .from('profili')
          .update({ ultimo_accesso: new Date().toISOString() })
          .eq('id', session.user.id);

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

  const homeLink = isNub ? '/nubilato' : '/';
  const brandName = isNub ? 'Missione Yas 💍' : 'Missione Pera 🍐';
  const brandColor = isNub ? 'text-pink-600' : 'text-blue-600';
  const switchLink = isNub ? '/' : '/nubilato';

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2">
        {/* Minute — solo celibato */}
        {!isNub && (
          <Link href="/minute" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Verbali Incontri">
            <ClipboardList size={22} />
          </Link>
        )}
        {/* Admin */}
        {isAdmin && (
          <Link href="/admin" className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="Admin Panel">
            <Shield size={20} />
          </Link>
        )}
        {/* Switch Celibato/Nubilato — solo admin */}
        {isAdmin && (
          <Link href={switchLink} className={`p-2 rounded-xl transition-all flex items-center gap-1 ${isNub ? 'text-pink-500 hover:bg-pink-50' : 'text-blue-500 hover:bg-blue-50'}`} title={isNub ? 'Vai al Celibato' : 'Vai al Nubilato'}>
            <ArrowLeftRight size={18} />
            <span className="text-[10px] font-black uppercase">{isNub ? '🍐' : '💍'}</span>
          </Link>
        )}
        <Link href={homeLink} className={`text-lg font-bold tracking-tighter ${brandColor}`}>
          {brandName}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {onlineUsers.length >= 2 && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 animate-pulse">
            <Eye size={16} />
            <span className="text-xs font-bold">{onlineUsers.length} online</span>
          </div>
        )}
        <Link href="/profilo" className="group relative">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
            <User size={20} />
          </div>
        </Link>
      </div>
    </nav>
  );
}