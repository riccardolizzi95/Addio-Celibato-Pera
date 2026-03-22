'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Shield, Users, Clock, Wifi, WifiOff, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profili, setProfili] = useState<any[]>([]);
    const [logAccessi, setLogAccessi] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3500);
    };

    const eliminaUtente = async (userId: string) => {
        setDeletingId(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({ user_id: userId }),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                mostraFeedback(data.error || 'Errore durante l\'eliminazione', 'error');
            } else {
                mostraFeedback('Utente eliminato! 🗑️', 'success');
                scaricaDati();
            }
        } catch {
            mostraFeedback('Errore di rete', 'error');
        }
        setDeletingId(null);
        setConfirmDeleteId(null);
    };

    // Un utente è "online" se ultimo_accesso è entro gli ultimi 2 minuti
    const isOnline = (ultimoAccesso: string | null) => {
        if (!ultimoAccesso) return false;
        return (Date.now() - new Date(ultimoAccesso).getTime()) < 2 * 60 * 1000;
    };
    const countOnline = profili.filter(p => isOnline(p.ultimo_accesso)).length;

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
            const { data: profilo } = await supabase
                .from('profili')
                .select('admin')
                .eq('id', session.user.id)
                .single();
            if (!profilo?.admin) {
                window.location.assign('/');
                return;
            }
            setIsAdmin(true);
            setLoading(false);
            scaricaDati();

            // Aggiorna i dati ogni 30 secondi per rilevare chi è online
            const interval = setInterval(scaricaDati, 30000);
            return () => clearInterval(interval);
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

            {/* Toast feedback */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

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
                    <p className="text-3xl font-black text-emerald-600">{countOnline}</p>
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
                        const online = isOnline(p.ultimo_accesso);
                        const isConfirming = confirmDeleteId === p.id;
                        return (
                            <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                {p.username || 'Senza nome'}
                                                {p.admin && <span className="ml-1.5 text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md">ADMIN</span>}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {online ? (
                                                    <span className="text-emerald-600 font-bold">Online ora</span>
                                                ) : (
                                                    <>Ultimo accesso: {tempoFa(p.ultimo_accesso)}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {online ? (
                                            <Wifi size={16} className="text-emerald-500" />
                                        ) : (
                                            <WifiOff size={16} className="text-slate-300" />
                                        )}
                                        {!p.admin && (
                                            <button
                                                onClick={() => setConfirmDeleteId(isConfirming ? null : p.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Conferma eliminazione */}
                                {isConfirming && (
                                    <div className="mt-3 pt-3 border-t border-red-100 animate-in fade-in duration-200">
                                        <p className="text-xs text-red-600 font-bold mb-2">
                                            Eliminare {p.username || 'questo utente'}? L'account e tutti i dati verranno rimossi definitivamente.
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmDeleteId(null)}
                                                className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">
                                                Annulla
                                            </button>
                                            <button
                                                onClick={() => eliminaUtente(p.id)}
                                                disabled={deletingId === p.id}
                                                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold disabled:bg-slate-300 active:scale-95 transition-all">
                                                {deletingId === p.id ? 'Eliminando...' : '🗑️ Elimina definitivamente'}
                                            </button>
                                        </div>
                                    </div>
                                )}
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