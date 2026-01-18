'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Eye, ClipboardList } from 'lucide-react'; 
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Recuperiamo lo username reale dal database per mostrarlo nell'elenco online
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
            // Otteniamo nomi unici per evitare duplicati
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
    <nav className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      {/* SEZIONE SINISTRA: Minute e Logo */}
      <div className="flex items-center gap-4">
        <Link 
          href="/minute" 
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          title="Verbali Incontri"
        >
          <ClipboardList size={24} />
        </Link>
        
        <Link href="/" className="text-xl font-bold text-blue-600 tracking-tighter">
          Missione Pera 🍐
        </Link>
      </div>
      
      {/* SEZIONE DESTRA: Online indicator e Profilo */}
      <div className="flex items-center gap-3">
        {/* Indicatore Online Social: appare se >= 2 persone sono connesse */}
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