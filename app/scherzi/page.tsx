'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Trash2, Pencil, ChevronDown, ChevronUp, Zap, Package, Users, Lock, CheckCircle, Clock, Lightbulb, PlayCircle } from 'lucide-react';

const DIFFICOLTA_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
    facile:   { label: 'Facile',    color: 'bg-emerald-50 text-emerald-600 border-emerald-100', emoji: '😄' },
    media:    { label: 'Media',     color: 'bg-amber-50 text-amber-600 border-amber-100',       emoji: '😏' },
    difficile:{ label: 'Difficile', color: 'bg-red-50 text-red-600 border-red-100',             emoji: '😈' },
};

const STATO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    idea:       { label: 'Idea',        color: 'bg-slate-100 text-slate-500',            icon: Lightbulb },
    approvata:  { label: 'Approvata ✅', color: 'bg-emerald-100 text-emerald-700',        icon: CheckCircle },
    in_corso:   { label: 'In corso 🔥', color: 'bg-amber-100 text-amber-700',             icon: PlayCircle },
    completata: { label: 'Fatta! 🎉',   color: 'bg-blue-100 text-blue-700',              icon: CheckCircle },
};

export default function ScherziPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [myUsername, setMyUsername] = useState('');
    const [lista, setLista] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Campi form
    const [titolo, setTitolo] = useState('');
    const [descrizione, setDescrizione] = useState('');
    const [difficolta, setDifficolta] = useState<'facile' | 'media' | 'difficile'>('media');
    const [materiali, setMateriali] = useState('');
    const [responsabili, setResponsabili] = useState('');
    const [noteSegrete, setNoteSegrete] = useState('');
    const [stato, setStato] = useState<'idea' | 'approvata' | 'in_corso' | 'completata'>('idea');

    const scaricaDati = async () => {
        const { data, error } = await supabase
            .from('scherzi')
            .select('*, voti_scherzi(*, profili(username))')
            .order('created_at', { ascending: false });
        if (!error) setLista(data || []);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { window.location.assign(`/login?returnTo=/scherzi`); return; }
            setUserId(session.user.id);
            const { data: prof } = await supabase.from('profili').select('username, admin').eq('id', session.user.id).single();
            if (prof) { setMyUsername(prof.username); setIsAdmin(prof.admin || false); }
            setLoading(false);
            scaricaDati();
        };
        init();
    }, []);

    useEffect(() => {
        const channel = supabase.channel('scherzi-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scherzi' }, scaricaDati)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const resetForm = () => {
        setIsFormOpen(false); setEditingId(null);
        setTitolo(''); setDescrizione(''); setDifficolta('media');
        setMateriali(''); setResponsabili(''); setNoteSegrete(''); setStato('idea');
    };

    const apriModifica = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setTitolo(item.titolo); setDescrizione(item.descrizione || '');
        setDifficolta(item.difficolta || 'media'); setMateriali(item.materiali || '');
        setResponsabili(item.responsabili || ''); setNoteSegrete(item.note_segrete || '');
        setStato(item.stato || 'idea');
        setIsFormOpen(true); setExpandedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const salva = async () => {
        if (!titolo.trim()) return mostraFeedback('Inserisci almeno un titolo!', 'error');
        setIsLoadingAction(true);
        const payload = {
            titolo: titolo.trim(), descrizione: descrizione.trim(),
            difficolta, materiali: materiali.trim() || null,
            responsabili: responsabili.trim() || null,
            note_segrete: noteSegrete.trim() || null,
            stato,
        };
        if (editingId) {
            const { error } = await supabase.from('scherzi').update(payload).eq('id', editingId);
            if (error) mostraFeedback('Errore durante la modifica.', 'error');
            else { mostraFeedback('Scherzo aggiornato! ✅', 'success'); resetForm(); scaricaDati(); }
        } else {
            const { error } = await supabase.from('scherzi').insert([{ ...payload, creatore: myUsername || 'Anonimo' }]);
            if (error) mostraFeedback("Errore durante l'invio.", 'error');
            else { mostraFeedback('Scherzo aggiunto! 😈', 'success'); resetForm(); scaricaDati(); }
        }
        setIsLoadingAction(false);
    };

    const elimina = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase.from('scherzi').delete().eq('id', id);
        if (error) mostraFeedback("Errore durante l'eliminazione.", 'error');
        else scaricaDati();
    };

    const aggiornaStato = async (id: number, nuovoStato: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from('scherzi').update({ stato: nuovoStato }).eq('id', id);
        scaricaDati();
    };

    const gestisciVoto = async (scherzoId: number, valoreRichiesto: number) => {
        if (!userId) return;
        const votoEsistente = lista.find(s => s.id === scherzoId)?.voti_scherzi?.find((v: any) => v.user_id === userId);
        if (votoEsistente && votoEsistente.valore === valoreRichiesto) {
            await supabase.from('voti_scherzi').delete().eq('scherzo_id', scherzoId).eq('user_id', userId);
        } else {
            await supabase.from('voti_scherzi').upsert(
                { scherzo_id: scherzoId, user_id: userId, valore: valoreRichiesto },
                { onConflict: 'scherzo_id,user_id' }
            );
        }
        scaricaDati();
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">

            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-purple-600 font-semibold">← Home</Link>
                <h1 className="text-2xl font-black tracking-tight">Scherzi 😈</h1>
            </div>

            {/* Form */}
            <div className="mb-8">
                {isFormOpen ? (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-400 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                        <p className="text-xs font-black text-purple-600 uppercase tracking-widest">
                            {editingId ? '✏️ Modifica Scherzo' : '😈 Nuovo Scherzo'}
                        </p>

                        {/* Titolo */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Titolo</label>
                            <input type="text" placeholder="Es: Finto invito a fare un discorso..." value={titolo}
                                onChange={e => setTitolo(e.target.value)}
                                className="w-full p-4 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 ring-purple-400" />
                        </div>

                        {/* Descrizione */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrizione</label>
                            <textarea placeholder="Come funziona lo scherzo?" value={descrizione}
                                onChange={e => setDescrizione(e.target.value)} rows={3}
                                className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 ring-purple-400" />
                        </div>

                        {/* Difficoltà */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Difficoltà</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['facile', 'media', 'difficile'] as const).map(d => (
                                    <button key={d} onClick={() => setDifficolta(d)}
                                        className={`py-3 rounded-xl font-bold text-sm border transition-all ${difficolta === d ? DIFFICOLTA_CONFIG[d].color + ' border-current' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {DIFFICOLTA_CONFIG[d].emoji} {DIFFICOLTA_CONFIG[d].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Materiali */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Materiali necessari</label>
                            <input type="text" placeholder="Es: Cartello, pennarello..." value={materiali}
                                onChange={e => setMateriali(e.target.value)}
                                className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 ring-purple-400" />
                        </div>

                        {/* Responsabili */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Responsabili</label>
                            <input type="text" placeholder="Chi si occupa di realizzarlo?" value={responsabili}
                                onChange={e => setResponsabili(e.target.value)}
                                className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 ring-purple-400" />
                        </div>

                        {/* Note segrete (solo admin vede) */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                <Lock size={10} /> Note Segrete (solo admin)
                            </label>
                            <textarea placeholder="Dettagli riservati, coordinate segrete, piani segreti..." value={noteSegrete}
                                onChange={e => setNoteSegrete(e.target.value)} rows={2}
                                className="w-full p-4 border rounded-xl bg-purple-50 outline-none focus:ring-2 ring-purple-400 text-sm" />
                        </div>

                        {/* Stato (solo admin) */}
                        {isAdmin && (
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Stato</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['idea', 'approvata', 'in_corso', 'completata'] as const).map(s => (
                                        <button key={s} onClick={() => setStato(s)}
                                            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${stato === s ? STATO_CONFIG[s].color : 'bg-slate-50 text-slate-400'}`}>
                                            {STATO_CONFIG[s].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button onClick={resetForm} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annulla</button>
                            <button onClick={salva} disabled={isLoadingAction}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold disabled:bg-slate-300">
                                {isLoadingAction ? 'Salvataggio...' : editingId ? 'Salva Modifiche' : 'Aggiungi 😈'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsFormOpen(true)}
                        className="w-full bg-purple-600 text-white rounded-2xl py-5 font-bold shadow-xl shadow-purple-100 active:scale-95 transition-all text-lg">
                        😈 Proponi uno Scherzo
                    </button>
                )}
            </div>

            {/* Lista scherzi */}
            <div className="space-y-4">
                {lista.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                        <p className="text-5xl mb-3">😇</p>
                        <p className="text-slate-400 font-bold">Nessuno scherzo ancora proposto...</p>
                        <p className="text-slate-300 text-sm mt-1">Per ora siamo tutti bravi ragazzi.</p>
                    </div>
                )}
                {lista.map(item => {
                    const votiSu = item.voti_scherzi?.filter((v: any) => v.valore === 1) || [];
                    const votiGiu = item.voti_scherzi?.filter((v: any) => v.valore === -1) || [];
                    const mioVoto = item.voti_scherzi?.find((v: any) => v.user_id === userId)?.valore;
                    const isExpanded = expandedId === item.id;
                    const isMio = userId === item.user_id;
                    const diff = DIFFICOLTA_CONFIG[item.difficolta || 'media'];
                    const statoConf = STATO_CONFIG[item.stato || 'idea'];

                    return (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* Header */}
                            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-black text-xl text-slate-800 leading-tight">{item.titolo}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Da: {item.creatore}</p>
                                    </div>
                                    {isMio && (
                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={e => apriModifica(item, e)} className="text-slate-300 hover:text-purple-500 transition-colors p-1.5">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={e => elimina(item.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Badge riga */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${diff.color}`}>
                                        {diff.emoji} {diff.label}
                                    </span>
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${statoConf.color}`}>
                                        {statoConf.label}
                                    </span>
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${votiSu.length > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👍 {votiSu.length}
                                    </span>
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${votiGiu.length > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👎 {votiGiu.length}
                                    </span>
                                </div>
                            </div>

                            {/* Sezione espansa */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">

                                    {/* Descrizione */}
                                    {item.descrizione?.trim() && (
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl whitespace-pre-wrap">
                                            {item.descrizione}
                                        </p>
                                    )}

                                    {/* Materiali + Responsabili */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {item.materiali && (
                                            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <Package size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Materiali</p>
                                                    <p className="text-sm font-bold text-amber-900">{item.materiali}</p>
                                                </div>
                                            </div>
                                        )}
                                        {item.responsabili && (
                                            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <Users size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">Responsabili</p>
                                                    <p className="text-sm font-bold text-blue-900">{item.responsabili}</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Note segrete — solo admin */}
                                        {isAdmin && item.note_segrete && (
                                            <div className="flex items-start gap-3 bg-purple-50 p-4 rounded-xl border border-purple-200">
                                                <Lock size={16} className="text-purple-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-1">Note Segrete</p>
                                                    <p className="text-sm font-bold text-purple-900">{item.note_segrete}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cambio stato rapido (solo admin) */}
                                    {isAdmin && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cambia Stato</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['idea', 'approvata', 'in_corso', 'completata'] as const).map(s => (
                                                    <button key={s}
                                                        onClick={e => aggiornaStato(item.id, s, e)}
                                                        className={`py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${item.stato === s ? STATO_CONFIG[s].color + ' ring-2 ring-current ring-offset-1' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                                        {STATO_CONFIG[s].label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Voti */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => gestisciVoto(item.id, -1)}
                                                className={`w-full py-3 rounded-xl font-bold transition-all ${mioVoto === -1 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                👎 {votiGiu.length}
                                            </button>
                                            {votiGiu.length > 0 && (
                                                <p className="text-[10px] text-slate-400 pl-1">No: {votiGiu.map((v: any) => v.profili?.username).join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => gestisciVoto(item.id, 1)}
                                                className={`w-full py-3 rounded-xl font-bold transition-all ${mioVoto === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                👍 {votiSu.length}
                                            </button>
                                            {votiSu.length > 0 && (
                                                <p className="text-[10px] text-slate-400 pl-1">Sì: {votiSu.map((v: any) => v.profili?.username).join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>
    );
}