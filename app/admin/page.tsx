'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Shield, Users, Clock, Wifi, WifiOff, RefreshCw, Trash2, UserPlus, Mail, X } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profili, setProfili] = useState<any[]>([]);
    const [logAccessi, setLogAccessi] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newGruppo, setNewGruppo] = useState<'celibato' | 'nubilato'>('celibato');
    const [isCreating, setIsCreating] = useState(false);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3500);
    };

    const [createdInfo, setCreatedInfo] = useState<{ email: string; link: string } | null>(null);

    const creaUtente = async () => {
        if (!newEmail.trim()) return mostraFeedback('Email obbligatoria', 'error');
        setIsCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ email: newEmail.trim(), gruppo: newGruppo }),
                }
            );
            const data = await res.json();
            if (!res.ok) mostraFeedback(data.error || 'Errore nella creazione', 'error');
            else {
                setCreatedInfo({ email: newEmail.trim(), link: data.magic_link || '' });
                setNewEmail(''); setShowAddForm(false); scaricaDati();
            }
        } catch { mostraFeedback('Errore di rete', 'error'); }
        setIsCreating(false);
    };

    const eliminaUtente = async (userId: string) => {
        setDeletingId(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
                    body: JSON.stringify({ user_id: userId }),
                }
            );
            const data = await res.json();
            if (!res.ok) mostraFeedback(data.error || 'Errore eliminazione', 'error');
            else { mostraFeedback('Utente eliminato! 🗑️', 'success'); scaricaDati(); }
        } catch { mostraFeedback('Errore di rete', 'error'); }
        setDeletingId(null);
        setConfirmDeleteId(null);
    };

    const isOnline = (ua: string | null) => ua ? (Date.now() - new Date(ua).getTime()) < 300000 : false;
    const countOnline = profili.filter(p => isOnline(p.ultimo_accesso)).length;
    const countCelibato = profili.filter(p => p.gruppo === 'celibato').length;
    const countNubilato = profili.filter(p => p.gruppo === 'nubilato').length;

    const scaricaDati = async () => {
        const { data: allProfili } = await supabase.from('profili').select('*').order('ultimo_accesso', { ascending: false, nullsFirst: false });
        if (allProfili) setProfili(allProfili);
        const { data: logs } = await supabase.from('log_accessi').select('*').order('created_at', { ascending: false }).limit(50);
        if (logs) setLogAccessi(logs);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { window.location.assign('/login'); return; }
            const { data: profilo } = await supabase.from('profili').select('admin').eq('id', session.user.id).single();
            if (!profilo?.admin) { window.location.assign('/'); return; }
            setIsAdmin(true); setLoading(false); scaricaDati();
            const interval = setInterval(scaricaDati, 30000);
            return () => clearInterval(interval);
        };
        init();
    }, []);

    const tempoFa = (d: string | null) => {
        if (!d) return 'Mai';
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Adesso';
        if (m < 60) return `${m} min fa`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h fa`;
        return `${Math.floor(h / 24)}g fa`;
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500" /></div>;
    if (!isAdmin) return null;

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="text-slate-600 font-semibold">← Home</Link>
                <h1 className="text-xl font-black tracking-tight flex items-center gap-2"><Shield size={20} /> Admin</h1>
                <button onClick={scaricaDati} className="text-slate-400 hover:text-slate-600 transition-colors"><RefreshCw size={20} /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Totali</p>
                    <p className="text-2xl font-black text-slate-800">{profili.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-sm">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Online</p>
                    <p className="text-2xl font-black text-emerald-600">{countOnline}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-blue-100 shadow-sm">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">🍐</p>
                    <p className="text-2xl font-black text-blue-600">{countCelibato}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-pink-100 shadow-sm">
                    <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-1">💍</p>
                    <p className="text-2xl font-black text-pink-600">{countNubilato}</p>
                </div>
            </div>

            {/* Aggiungi utente */}
            <div className="mb-6">
                {/* Banner link invito */}
                {createdInfo && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">✅ Utente Creato!</p>
                            <button onClick={() => setCreatedInfo(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>
                        <p className="text-sm text-slate-600">Manda questo link all'utente — cliccandolo entrerà direttamente e potrà scegliere nome e password:</p>
                        {createdInfo.link ? (
                            <>
                                <div className="bg-white rounded-xl p-3 text-xs font-mono break-all border border-emerald-200 text-blue-600">{createdInfo.link}</div>
                                <button onClick={() => {
                                    const text = `Ciao! Clicca questo link per accedere e impostare il tuo account:\n\n🔗 ${createdInfo.link}\n\nDopo aver cliccato, scegli il tuo nome e una password.`;
                                    navigator.clipboard.writeText(text);
                                    mostraFeedback('Copiato! Incollalo su WhatsApp 📋', 'success');
                                }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold active:scale-95 transition-all">
                                    📋 Copia messaggio per WhatsApp
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-red-500 font-bold">⚠️ Link non generato. L'utente può usare "Password dimenticata" dal login.</p>
                        )}
                    </div>
                )}

                {showAddForm ? (
                    <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-emerald-400 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">➕ Nuovo Utente</p>
                            <button onClick={() => setShowAddForm(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gruppo</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setNewGruppo('celibato')}
                                    className={`py-3 rounded-xl font-bold text-sm transition-all ${newGruppo === 'celibato' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    🍐 Celibato
                                </button>
                                <button onClick={() => setNewGruppo('nubilato')}
                                    className={`py-3 rounded-xl font-bold text-sm transition-all ${newGruppo === 'nubilato' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    💍 Nubilato
                                </button>
                            </div>
                        </div>
                        <button onClick={creaUtente} disabled={isCreating}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:bg-slate-300 active:scale-95 transition-all">
                            {isCreating ? 'Creazione...' : '➕ Crea Utente'}
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setShowAddForm(true)}
                        className="w-full bg-emerald-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <UserPlus size={20} /> Aggiungi Utente
                    </button>
                )}
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
                        const isNub = p.gruppo === 'nubilato';
                        return (
                            <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="font-bold text-slate-800">{p.username || 'Senza nome'}</p>
                                                {p.admin && <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md">ADMIN</span>}
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${isNub ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {isNub ? '💍' : '🍐'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                {online ? <span className="text-emerald-600 font-bold">Online ora</span> : <>Ultimo accesso: {tempoFa(p.ultimo_accesso)}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {online ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-slate-300" />}
                                        {!p.admin && (
                                            <button onClick={() => setConfirmDeleteId(isConfirming ? null : p.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isConfirming && (
                                    <div className="mt-3 pt-3 border-t border-red-100">
                                        <p className="text-xs text-red-600 font-bold mb-2">Eliminare {p.username || 'questo utente'}? Tutto verrà rimosso.</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">Annulla</button>
                                            <button onClick={() => eliminaUtente(p.id)} disabled={deletingId === p.id}
                                                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold disabled:bg-slate-300 active:scale-95 transition-all">
                                                {deletingId === p.id ? 'Eliminando...' : '🗑️ Elimina'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {logAccessi.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-slate-400" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Log accessi</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {logAccessi.map((log, i) => (
                            <div key={log.id} className={`px-4 py-3 flex items-center justify-between ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{log.username || '—'}</p>
                                    <p className="text-[11px] text-slate-400">{log.azione}</p>
                                </div>
                                <p className="text-[11px] text-slate-400 shrink-0">
                                    {new Date(log.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}