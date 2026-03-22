'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Shield, Users, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profili, setProfili] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [logAccessi, setLogAccessi] = useState<any[]>([]);

    const scaricaDati = async () => {
        const { data: allProfili } = await supabase
            .from('profili')
            .select('*')
            .order('ultimo_accesso', { ascending: false, nullsFirst: false });
        if (allProfili) setProfili(allProfili);

        const { data: logs } = await supabase
            .from('log_accessi')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (logs) setLogAccessi(logs);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.assign('/login?returnTo=/admin');
                return;
            }
            const { data: prof } = await supabase
                .from('profili')
                .select('admin')
                .eq('id', session.user.id)
                .single();
            if (!prof?.admin) {
                window.location.assign('/');
                return;
            }
            setIsAdmin(true);
            setLoading(false);
            scaricaDati();

            // Presenza realtime
            const channel = supabase.channel('admin-presence', {
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
                .subscribe();

            return () => { channel.unsubscribe(); };
        };
        init();
    }, []);

    const tempoFa = (data: string | null) => {
        if (!data) return 'Mai';
        const diff = Date.now() - new Date(data).getTime();
        const minuti = Math.floor(diff / 60000);
        if (minuti < 1) return 'Adesso';
        if (minuti < 60) return `${minuti} min fa`;
        const ore = Math.floor(minuti / 60);
        if (ore < 24) return `${ore}h fa`;
        const giorni = Math.floor(ore / 24);
        return `${giorni}g fa`;
    };

    const formatData = (data: string) => {
        return new Date(data).toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500"></div>
        </div>
    );

    if (!isAdmin) return null;

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="text-slate-600 font-semibold">← Home</Link>
                <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Shield size={20} /> Admin
                </h1>
                <button onClick={scaricaDati} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utenti totali</p>
                    <p className="text-3xl font-black text-slate-800">{profili.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Online ora</p>
                    <p className="text-3xl font-black text-emerald-600">{onlineUsers.length}</p>
                </div>
            </div>

            {/* Lista utenti */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-slate-400" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Utenti</p>
                </div>
                <div className="space-y-2">
                    {profili.map(p => {
                        const isOnline = onlineUsers.includes(p.username);
                        return (
                            <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {p.username || 'Senza nome'}
                                                {p.admin && <span className="ml-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md">ADMIN</span>}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {isOnline ? (
                                                    <span className="text-emerald-600 font-bold">Online ora</span>
                                                ) : (
                                                    <>Ultimo accesso: {tempoFa(p.ultimo_accesso)}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isOnline ? (
                                            <Wifi size={16} className="text-emerald-500" />
                                        ) : (
                                            <WifiOff size={16} className="text-slate-300" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Log accessi recenti */}
            {logAccessi.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-slate-400" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Log accessi recenti</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {logAccessi.map((log, i) => (
                            <div key={log.id} className={`px-4 py-3 flex items-center justify-between ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{log.username || '—'}</p>
                                    <p className="text-[11px] text-slate-400">{log.azione}</p>
                                </div>
                                <p className="text-[11px] text-slate-400 shrink-0">{formatData(log.created_at)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}