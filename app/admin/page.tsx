'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Shield, Users, Clock, Wifi, WifiOff, RefreshCw, Trash2, UserPlus, Mail, X, KeyRound } from 'lucide-react';

const GRUPPI = ['celibato', 'nubilato', 'scherzi_sposo', 'scherzi_sposa'] as const;
type Gruppo = typeof GRUPPI[number];
const gruppoLabel = (g: string) => g === 'celibato' ? '🍐 Celibato' : g === 'nubilato' ? '💍 Nubilato' : g === 'scherzi_sposo' ? '🎭 Scherzi Sposo' : g === 'scherzi_sposa' ? '🎭 Scherzi Sposa' : g;
const gruppoBadge = (g: string) => g === 'celibato' ? 'bg-blue-50 text-blue-600 border-blue-100' : g === 'nubilato' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-amber-50 text-amber-600 border-amber-100';
const gruppoIcon = (g: string) => g === 'celibato' ? '🍐' : g === 'nubilato' ? '💍' : '🎭';
const nomeBreve = (u: string) => { if (!u) return 'Senza nome'; return u.includes('@') ? u.split('@')[0] : u; };

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profili, setProfili] = useState<any[]>([]);
    const [logAccessi, setLogAccessi] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newGruppo, setNewGruppo] = useState<Gruppo>('celibato');
    const [isCreating, setIsCreating] = useState(false);
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [resetInfo, setResetInfo] = useState<{ email: string; link: string } | null>(null);
    const [createdInfo, setCreatedInfo] = useState<{ email: string; link: string } | null>(null);
    const [filtroGruppo, setFiltroGruppo] = useState<'tutti' | Gruppo>('tutti');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3500);
    };

    const creaUtente = async () => {
        if (!newEmail.trim()) return mostraFeedback('Email obbligatoria', 'error');
        setIsCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ email: newEmail.trim(), gruppo: newGruppo }) }
            );
            const data = await res.json();
            if (!res.ok) mostraFeedback(data.error || 'Errore nella creazione', 'error');
            else { setCreatedInfo({ email: newEmail.trim(), link: data.invite_link || '' }); setNewEmail(''); setShowAddForm(false); scaricaDati(); }
        } catch { mostraFeedback('Errore di rete', 'error'); }
        setIsCreating(false);
    };

    const eliminaUtente = async (userId: string) => {
        setDeletingId(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }, body: JSON.stringify({ user_id: userId }) }
            );
            const data = await res.json();
            if (!res.ok) mostraFeedback(data.error || 'Errore eliminazione', 'error');
            else { mostraFeedback('Utente eliminato! 🗑️', 'success'); setSelectedUser(null); scaricaDati(); }
        } catch { mostraFeedback('Errore di rete', 'error'); }
        setDeletingId(null); setConfirmDelete(false);
    };

    const resetPassword = async (userId: string) => {
        setResettingId(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-password`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ user_id: userId }) }
            );
            const data = await res.json();
            if (!res.ok) mostraFeedback(data.error || 'Errore reset', 'error');
            else { setResetInfo({ email: data.email || '', link: data.reset_link || '' }); setSelectedUser(null); mostraFeedback('Link reset generato! 🔑', 'success'); }
        } catch { mostraFeedback('Errore di rete', 'error'); }
        setResettingId(null);
    };

    const cambiaGruppo = async (userId: string, nuovoGruppo: Gruppo) => {
        const { error } = await supabase.from('profili').update({ gruppo: nuovoGruppo }).eq('id', userId);
        // Aggiorna anche invitati
        const user = profili.find(p => p.id === userId);
        if (user) {
            const email = user.username?.includes('@') ? user.username : null;
            if (email) await supabase.from('invitati').update({ gruppo: nuovoGruppo }).eq('email', email.toLowerCase());
        }
        if (!error) {
            mostraFeedback(`Gruppo cambiato a ${gruppoLabel(nuovoGruppo)}`, 'success');
            setSelectedUser((prev: any) => prev ? { ...prev, gruppo: nuovoGruppo } : null);
            scaricaDati();
        } else mostraFeedback('Errore nel cambio gruppo', 'error');
    };

    const toggleAdminNubilato = async (userId: string, current: boolean) => {
        await supabase.from('profili').update({ admin_nubilato: !current }).eq('id', userId);
        mostraFeedback(!current ? 'Admin nubilato assegnato! 💍' : 'Admin nubilato rimosso', 'success');
        setSelectedUser((prev: any) => prev ? { ...prev, admin_nubilato: !current } : null);
        scaricaDati();
    };

    const isOnline = (ua: string | null) => ua ? (Date.now() - new Date(ua).getTime()) < 300000 : false;
    const countOnline = profili.filter(p => isOnline(p.ultimo_accesso)).length;
    const countCelibato = profili.filter(p => p.gruppo === 'celibato').length;
    const countNubilato = profili.filter(p => p.gruppo === 'nubilato').length;
    const countScherzi = profili.filter(p => p.gruppo === 'scherzi_sposo' || p.gruppo === 'scherzi_sposa').length;

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

    const profiliFiltrati = profili.filter(p => {
        if (filtroGruppo === 'tutti') return true;
        if (filtroGruppo === 'scherzi_sposo') return p.gruppo === 'scherzi_sposo' || p.gruppo === 'scherzi_sposa';
        return p.gruppo === filtroGruppo;
    });

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* === POPUP DETTAGLIO UTENTE === */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedUser(null); setConfirmDelete(false); }}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black">👤 Dettaglio Utente</h2>
                            <button onClick={() => { setSelectedUser(null); setConfirmDelete(false); }}><X size={20} className="text-slate-400" /></button>
                        </div>

                        {/* Info */}
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                            <p className="text-lg font-black text-slate-800">{nomeBreve(selectedUser.username)}</p>
                            {selectedUser.username?.includes('@') && <p className="text-[11px] text-slate-400">{selectedUser.username}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${gruppoBadge(selectedUser.gruppo)}`}>{gruppoLabel(selectedUser.gruppo)}</span>
                                {selectedUser.admin && <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-md">ADMIN</span>}
                                {selectedUser.admin_nubilato && <span className="text-[10px] font-black bg-pink-100 text-pink-600 px-2 py-1 rounded-md">ADMIN 💍</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">
                                {isOnline(selectedUser.ultimo_accesso) ? <span className="text-emerald-600 font-bold">● Online ora</span> : <>Ultimo accesso: {tempoFa(selectedUser.ultimo_accesso)}</>}
                            </p>
                        </div>

                        {/* Cambio gruppo */}
                        {!selectedUser.admin && (
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cambia Gruppo</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {GRUPPI.map(g => (
                                        <button key={g} onClick={() => cambiaGruppo(selectedUser.id, g)}
                                            className={`py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedUser.gruppo === g ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {gruppoLabel(g)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Toggle admin nubilato */}
                        {!selectedUser.admin && (selectedUser.gruppo === 'nubilato' || selectedUser.gruppo === 'scherzi_sposa') && (
                            <button onClick={() => toggleAdminNubilato(selectedUser.id, selectedUser.admin_nubilato)}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${selectedUser.admin_nubilato ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 border border-pink-200'}`}>
                                <Shield size={14} className="inline mr-2" />
                                {selectedUser.admin_nubilato ? 'Rimuovi Admin Nubilato' : 'Assegna Admin Nubilato'}
                            </button>
                        )}

                        {/* Azioni */}
                        {!selectedUser.admin && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <button onClick={() => resetPassword(selectedUser.id)} disabled={resettingId === selectedUser.id}
                                    className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-all disabled:opacity-50">
                                    <KeyRound size={16} /> Reset Password
                                </button>

                                {!confirmDelete ? (
                                    <button onClick={() => setConfirmDelete(true)}
                                        className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
                                        <Trash2 size={16} /> Elimina Utente
                                    </button>
                                ) : (
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-2">
                                        <p className="text-xs text-red-600 font-bold">Eliminare {nomeBreve(selectedUser.username)}? Tutto verrà rimosso.</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 bg-white text-slate-500 rounded-xl text-xs font-bold border">Annulla</button>
                                            <button onClick={() => eliminaUtente(selectedUser.id)} disabled={deletingId === selectedUser.id}
                                                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold disabled:bg-slate-300">
                                                {deletingId === selectedUser.id ? 'Eliminando...' : '🗑️ Elimina'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">🍐 + 💍</p>
                    <p className="text-2xl font-black text-blue-600">{countCelibato + countNubilato}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-amber-100 shadow-sm">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">🎭</p>
                    <p className="text-2xl font-black text-amber-600">{countScherzi}</p>
                </div>
            </div>

            {/* Filtro gruppo */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                {(['tutti', 'celibato', 'nubilato', 'scherzi_sposo'] as const).map(f => (
                    <button key={f} onClick={() => setFiltroGruppo(f)}
                        className={`shrink-0 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${filtroGruppo === f ? (f === 'celibato' ? 'bg-blue-600 text-white' : f === 'nubilato' ? 'bg-pink-600 text-white' : f === 'scherzi_sposo' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white') : 'bg-white text-slate-400 border border-slate-100'}`}>
                        {f === 'tutti' ? '👥 Tutti' : f === 'celibato' ? '🍐 Celibato' : f === 'nubilato' ? '💍 Nubilato' : '🎭 Scherzi'}
                    </button>
                ))}
            </div>

            {/* Aggiungi utente */}
            <div className="mb-6">
                {createdInfo && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">✅ Utente Creato!</p>
                            <button onClick={() => setCreatedInfo(null)} className="p-1 text-slate-400"><X size={16} /></button>
                        </div>
                        <p className="text-sm text-slate-600">Manda questo link all'utente:</p>
                        {createdInfo.link ? (
                            <>
                                <div className="bg-white rounded-xl p-3 text-xs font-mono break-all border border-emerald-200 text-blue-600">{createdInfo.link}</div>
                                <button onClick={() => { navigator.clipboard.writeText(`Ciao! Clicca questo link per accedere:\n\n🔗 ${createdInfo.link}\n\nDopo aver cliccato, scegli il tuo nome e una password.`); mostraFeedback('Copiato! 📋', 'success'); }}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold active:scale-95 transition-all">📋 Copia messaggio per WhatsApp</button>
                            </>
                        ) : <p className="text-sm text-red-500 font-bold">⚠️ Link non generato.</p>}
                    </div>
                )}

                {resetInfo && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">🔑 Link Reset</p>
                            <button onClick={() => setResetInfo(null)} className="p-1 text-slate-400"><X size={16} /></button>
                        </div>
                        <p className="text-sm text-slate-600">Per <strong>{resetInfo.email}</strong>:</p>
                        {resetInfo.link ? (
                            <>
                                <div className="bg-white rounded-xl p-3 text-xs font-mono break-all border border-amber-200 text-blue-600">{resetInfo.link}</div>
                                <button onClick={() => { navigator.clipboard.writeText(`Ciao! Clicca questo link per reimpostare la password:\n\n🔗 ${resetInfo.link}`); mostraFeedback('Copiato! 📋', 'success'); }}
                                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold active:scale-95 transition-all">📋 Copia per WhatsApp</button>
                            </>
                        ) : <p className="text-sm text-red-500 font-bold">⚠️ Link non generato.</p>}
                    </div>
                )}

                {showAddForm ? (
                    <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-emerald-400 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">➕ Nuovo Utente</p>
                            <button onClick={() => setShowAddForm(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                className="w-full pl-10 p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gruppo</p>
                            <div className="grid grid-cols-2 gap-2">
                                {GRUPPI.map(g => (
                                    <button key={g} onClick={() => setNewGruppo(g)}
                                        className={`py-2.5 rounded-xl text-[11px] font-bold transition-all ${newGruppo === g ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {gruppoLabel(g)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={creaUtente} disabled={isCreating}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold active:scale-95 transition-all disabled:bg-slate-300">
                            {isCreating ? 'Creando...' : '✅ Crea Utente'}
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
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Utenti ({profiliFiltrati.length})</p>
                </div>
                <div className="space-y-2">
                    {profiliFiltrati.map(p => {
                        const online = isOnline(p.ultimo_accesso);
                        return (
                            <button key={p.id} onClick={() => { setSelectedUser(p); setConfirmDelete(false); }}
                                className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="font-bold text-slate-800 truncate max-w-[140px]">{nomeBreve(p.username)}</p>
                                                {p.admin && <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md shrink-0">ADMIN</span>}
                                                {p.admin_nubilato && <span className="text-[10px] font-black bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-md shrink-0">ADMIN 💍</span>}
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${gruppoBadge(p.gruppo)}`}>
                                                    {gruppoIcon(p.gruppo)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                {online ? <span className="text-emerald-600 font-bold">Online ora</span> : <>Ultimo accesso: {tempoFa(p.ultimo_accesso)}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 shrink-0">›</div>
                                </div>
                            </button>
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
                                    <p className="text-sm font-bold text-slate-700">{nomeBreve(log.username || '—')}</p>
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