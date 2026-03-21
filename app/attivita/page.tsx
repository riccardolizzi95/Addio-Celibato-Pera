'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Trash2, Pencil, Search, Euro, Users } from 'lucide-react';

export default function AttivitaPage() {
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [titolo, setTitolo] = useState("");
    const [descrizione, setDescrizione] = useState("");
    const [costoStimato, setCostoStimato] = useState("");
    const [maxPartecipanti, setMaxPartecipanti] = useState("");
    const [link, setLink] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [listaProposte, setListaProposte] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [myUsername, setMyUsername] = useState("");
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const scaricaDati = async () => {
        const { data, error } = await supabase
            .from('proposte')
            .select(`*, voti_proposte (*, profili (username))`)
            .order('created_at', { ascending: false });
        if (!error) setListaProposte(data || []);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
            } else {
                setUserId(session.user.id);
                const { data: prof } = await supabase.from('profili').select('username').eq('id', session.user.id).single();
                if (prof) setMyUsername(prof.username);
                setLoading(false);
                scaricaDati();
            }
        };
        checkUser();
    }, []);

    useEffect(() => {
        const channel = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => scaricaDati())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setTitolo("");
        setDescrizione("");
        setCostoStimato("");
        setMaxPartecipanti("");
        setLink("");
    };

    const apriModifica = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setTitolo(item.titolo);
        setDescrizione(item.descrizione || "");
        setCostoStimato(item.costo_stimato != null ? String(item.costo_stimato) : "");
        setMaxPartecipanti(item.max_partecipanti != null ? String(item.max_partecipanti) : "");
        setLink(item.link || "");
        setIsFormOpen(true);
        setExpandedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cercaSuGoogle = () => {
        if (!titolo.trim()) return;
        const query = `${titolo.trim()} Amsterdam cosa fare`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    const salvaProposte = async () => {
        if (!titolo.trim()) return mostraFeedback("Inserisci almeno un titolo!", 'error');

        const costo = costoStimato ? parseFloat(costoStimato) : null;
        const maxPax = maxPartecipanti ? parseInt(maxPartecipanti) : null;

        if (costoStimato && (isNaN(costo!) || costo! < 0)) return mostraFeedback("Costo non valido.", 'error');
        if (maxPartecipanti && (isNaN(maxPax!) || maxPax! < 1)) return mostraFeedback("Numero partecipanti non valido.", 'error');

        setIsLoadingAction(true);
        const payload = {
            titolo: titolo.trim(),
            descrizione: descrizione.trim(),
            costo_stimato: costo,
            max_partecipanti: maxPax,
            link: link.trim() || null,
        };

        if (editingId) {
            const { error } = await supabase.from('proposte').update(payload).eq('id', editingId);
            if (error) mostraFeedback("Errore durante la modifica.", 'error');
            else { mostraFeedback("Proposta aggiornata! ✅", 'success'); resetForm(); scaricaDati(); }
        } else {
            const { error } = await supabase.from('proposte').insert([{
                ...payload,
                creatore: myUsername || 'Anonimo',
                user_id: userId
            }]);
            if (error) mostraFeedback("Errore durante l'invio.", 'error');
            else { mostraFeedback("Proposta inviata! 🚀", 'success'); resetForm(); scaricaDati(); }
        }
        setIsLoadingAction(false);
    };

    const eliminaProposta = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from('proposte').delete().eq('id', id);
        scaricaDati();
    };

    const gestisciVoto = async (propostaId: number, valoreRichiesto: number) => {
        if (!userId) return;
        const votoEsistente = listaProposte
            .find(p => p.id === propostaId)?.voti_proposte
            ?.find((v: any) => v.user_id === userId);
        if (votoEsistente && votoEsistente.valore === valoreRichiesto) {
            await supabase.from('voti_proposte').delete().eq('proposta_id', propostaId).eq('user_id', userId);
        } else {
            await supabase.from('voti_proposte').upsert(
                { proposta_id: propostaId, user_id: userId, valore: valoreRichiesto },
                { onConflict: 'proposta_id,user_id' }
            );
        }
        scaricaDati();
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
                <h1 className="text-2xl font-bold text-center">Proposte</h1>
            </div>

            {/* Form nuova proposta / modifica */}
            <div className="mb-8">
                {isFormOpen ? (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-400 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
                            {editingId ? '✏️ Modifica Proposta' : '🚀 Nuova Proposta'}
                        </p>

                        {/* Titolo + bottone Google */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Titolo attività"
                                className="w-full p-4 pr-14 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 ring-blue-500"
                                value={titolo}
                                onChange={e => setTitolo(e.target.value)}
                            />
                            <button
                                onClick={cercaSuGoogle}
                                disabled={!titolo.trim()}
                                title="Cerca su Google"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Search size={18} />
                            </button>
                        </div>

                        {/* Descrizione */}
                        <textarea
                            placeholder="Descrizione (opzionale)..."
                            className="w-full p-4 border rounded-xl bg-slate-50 min-h-[90px] outline-none focus:ring-2 ring-blue-500"
                            value={descrizione}
                            onChange={e => setDescrizione(e.target.value)}
                        />

                        {/* Costo + Max partecipanti */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Costo (€)"
                                    className="w-full pl-9 pr-3 py-4 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 ring-blue-500"
                                    value={costoStimato}
                                    onChange={e => setCostoStimato(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Max pax"
                                    className="w-full pl-9 pr-3 py-4 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 ring-blue-500"
                                    value={maxPartecipanti}
                                    onChange={e => setMaxPartecipanti(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Link specifico */}
                        <div className="relative">
                            <input
                                type="url"
                                placeholder="Link specifico (opzionale)"
                                className="w-full p-4 border rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 ring-blue-500 pr-12"
                                value={link}
                                onChange={e => setLink(e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔗</span>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={resetForm} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">
                                Annulla
                            </button>
                            <button
                                onClick={salvaProposte}
                                disabled={isLoadingAction}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-slate-300"
                            >
                                {isLoadingAction ? "Salvataggio..." : editingId ? "Salva Modifiche" : "Conferma"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full bg-blue-600 text-white rounded-2xl py-5 font-bold shadow-xl shadow-blue-100 active:scale-95 transition-all text-lg"
                    >
                        🚀 Nuova Proposta
                    </button>
                )}
            </div>

            {/* Lista proposte */}
            <div className="space-y-4">
                {listaProposte.map((item) => {
                    const votiSu = item.voti_proposte?.filter((v: any) => v.valore === 1) || [];
                    const votiGiu = item.voti_proposte?.filter((v: any) => v.valore === -1) || [];
                    const mioVoto = item.voti_proposte?.find((v: any) => v.user_id === userId)?.valore;
                    const isExpanded = expandedId === item.id;
                    const isMia = userId === item.user_id;

                    return (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* Header card — sempre visibile */}
                            <div
                                className="p-5 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-bold text-xl text-slate-800 leading-tight">{item.titolo}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Da: {item.creatore}</p>
                                    </div>
                                    {isMia && (
                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={e => apriModifica(item, e)} className="text-slate-300 hover:text-blue-500 transition-colors p-1.5" title="Modifica">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={e => eliminaProposta(item.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5" title="Elimina">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Info rapide sempre visibili: costo, max pax, voti */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {item.costo_stimato != null && (
                                        <span className="flex items-center gap-1 text-[11px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full">
                                            <Euro size={11} /> {Number(item.costo_stimato).toFixed(0)}€
                                        </span>
                                    )}
                                    {item.max_partecipanti != null && (
                                        <span className="flex items-center gap-1 text-[11px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full">
                                            <Users size={11} /> max {item.max_partecipanti}
                                        </span>
                                    )}
                                    {/* Contatori voti sempre visibili nella miniatura */}
                                    <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${votiSu.length > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👍 {votiSu.length}
                                    </span>
                                    <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${votiGiu.length > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👎 {votiGiu.length}
                                    </span>
                                </div>
                            </div>

                            {/* Sezione espansa: descrizione + voti dettagliati */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-slate-50 pt-4 animate-in slide-in-from-top-2 duration-200">

                                    {/* Pulsante Google */}
                                    <a
                                        href={item.link || `https://www.google.com/search?q=${encodeURIComponent(item.titolo + ' Amsterdam cosa fare')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full mb-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {item.link
                                            ? <><span>🔗</span> Apri link</>
                                            : <><Search size={14} /> Cerca su Google</>
                                        }
                                    </a>

                                    {item.descrizione?.trim() !== "" && (
                                        <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm whitespace-pre-wrap mb-4">
                                            {item.descrizione}
                                        </div>
                                    )}

                                    {/* Voti con nomi */}
                                    <div className="grid grid-cols-2 gap-4 items-start">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => gestisciVoto(item.id, -1)}
                                                className={`w-full py-3 rounded-xl font-bold transition-all ${mioVoto === -1 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                👎 {votiGiu.length}
                                            </button>
                                            {votiGiu.length > 0 && (
                                                <p className="text-[10px] text-slate-400 pl-1 leading-tight">
                                                    No: {votiGiu.map((v: any) => v.profili?.username).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => gestisciVoto(item.id, 1)}
                                                className={`w-full py-3 rounded-xl font-bold transition-all ${mioVoto === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                👍 {votiSu.length}
                                            </button>
                                            {votiSu.length > 0 && (
                                                <p className="text-[10px] text-slate-400 pl-1 leading-tight">
                                                    Sì: {votiSu.map((v: any) => v.profili?.username).join(", ")}
                                                </p>
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