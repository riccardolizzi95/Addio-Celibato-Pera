'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Trash2, Pencil, Search, Euro, Users, Calendar, Clock, MapPin, Navigation, X } from 'lucide-react';

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
    const [isPianoOpen, setIsPianoOpen] = useState(false);
    const [pianoPieno, setPianoPieno] = useState<any[]>([]);
    const [addingToPiano, setAddingToPiano] = useState<number | null>(null);
    const [pianoGiorno, setPianoGiorno] = useState('2026-04-18');
    const [pianoOraInizio, setPianoOraInizio] = useState('10:00');
    const [pianoOraFine, setPianoOraFine] = useState('');
    const [pianoLuogo, setPianoLuogo] = useState('');
    const [pianoNote, setPianoNote] = useState('');
    const [luogoRisultati, setLuogoRisultati] = useState<any[]>([]);
    const [luogoLoading, setLuogoLoading] = useState(false);
    const [luogoQuery, setLuogoQuery] = useState('');
    const [loadingTratte, setLoadingTratte] = useState<Record<string, boolean>>({});
    const [tratte, setTratte] = useState<Record<string, any>>({});
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

    const scaricaPiano = async () => {
        const { data } = await supabase
            .from('piano_attivita')
            .select('*, proposte(id, titolo, luogo)')
            .order('giorno').order('ordine').order('ora_inizio');
        if (data) setPianoPieno(data);
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
                scaricaPiano();
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
        window.open(`https://www.google.com/search?q=${encodeURIComponent(titolo.trim() + ' Amsterdam cosa fare')}`, '_blank');
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
                user_id: userId,
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

    const aggiungiAPiano = async (propostaId: number) => {
        if (!pianoOraInizio) return;
        const { data: { user } } = await supabase.auth.getUser();
        const existing = pianoPieno.filter(p => p.giorno === pianoGiorno);
        await supabase.from('piano_attivita').upsert([{
            proposta_id: propostaId,
            giorno: pianoGiorno,
            ora_inizio: pianoOraInizio,
            ora_fine: pianoOraFine || null,
            luogo: pianoLuogo || null,
            note: pianoNote || null,
            ordine: existing.length,
            user_id: user?.id,
        }], { onConflict: 'proposta_id,giorno' });
        mostraFeedback('Aggiunta al piano! ✅', 'success');
        setAddingToPiano(null);
        setPianoOraInizio('10:00');
        setPianoOraFine('');
        setPianoLuogo('');
        setPianoNote('');
        setLuogoRisultati([]);
        setLuogoQuery('');
        scaricaPiano();
    };

    const rimuoviDaPiano = async (pianoId: number) => {
        await supabase.from('piano_attivita').delete().eq('id', pianoId);
        scaricaPiano();
    };

    const calcolaTratta = async (key: string, da: string, a: string) => {
        if (!da || !a) return;
        setLoadingTratte(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch(`/api/tratta?da=${encodeURIComponent(da + ' Amsterdam')}&a=${encodeURIComponent(a + ' Amsterdam')}`);
            if (res.ok) {
                const dati = await res.json();
                setTratte(prev => ({ ...prev, [key]: dati }));
            }
        } catch {}
        setLoadingTratte(prev => ({ ...prev, [key]: false }));
    };

    const cercaLuogo = async (query: string) => {
        if (!query.trim()) { setLuogoRisultati([]); return; }
        setLuogoLoading(true);
        try {
            const res = await fetch(`/api/cerca-luogo?q=${encodeURIComponent(query + ' Amsterdam')}`);
            if (res.ok) {
                const dati = await res.json();
                setLuogoRisultati(dati);
            }
        } catch {}
        setLuogoLoading(false);
    };

    const avviaCercaLuogoAuto = (titoloAttivita: string) => {
        const q = titoloAttivita.trim();
        setLuogoQuery(q);
        setLuogoRisultati([]);
        if (q) cercaLuogo(q);
    };

    const giorni = ['2026-04-18', '2026-04-19', '2026-04-20'];
    const labelGiorno = (d: string) => ({
        '2026-04-18': 'Sab 18 Aprile',
        '2026-04-19': 'Dom 19 Aprile',
        '2026-04-20': 'Lun 20 Aprile',
    } as Record<string, string>)[d] || d;

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">

            {/* Toast feedback */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
                <h1 className="text-2xl font-bold text-center">Proposte</h1>
                <div className="w-12" />
            </div>

            {/* Pulsanti / Form */}
            <div className="mb-8">
                {isFormOpen ? (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-400 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
                            {editingId ? '✏️ Modifica Proposta' : '🚀 Nuova Proposta'}
                        </p>

                        {/* Titolo + Google */}
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

                        {/* Costo + Max pax */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number" min="0" step="0.01" placeholder="Costo (€)"
                                    className="w-full pl-9 pr-3 py-4 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 ring-blue-500"
                                    value={costoStimato}
                                    onChange={e => setCostoStimato(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number" min="1" placeholder="Max pax"
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex-1 bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-blue-100 active:scale-95 transition-all text-base"
                        >
                            ➕ Aggiungi
                        </button>
                        <button
                            onClick={() => { setIsPianoOpen(true); scaricaPiano(); }}
                            className="flex-1 bg-emerald-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all text-base flex items-center justify-center gap-2"
                        >
                            <Calendar size={18} /> Piano
                        </button>
                    </div>
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

                            {/* Header card */}
                            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-bold text-xl text-slate-800 leading-tight">{item.titolo}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Da: {item.creatore}</p>
                                    </div>
                                    {isMia && (
                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={e => apriModifica(item, e)} className="text-slate-300 hover:text-blue-500 transition-colors p-1.5">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={e => eliminaProposta(item.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Badge rapidi */}
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
                                    <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${votiSu.length > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👍 {votiSu.length}
                                    </span>
                                    <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${votiGiu.length > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        👎 {votiGiu.length}
                                    </span>
                                </div>
                            </div>

                            {/* Sezione espansa */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-slate-50 pt-4 animate-in slide-in-from-top-2 duration-200">

                                    {/* Bottone link o Google */}
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

                                    {/* Voti */}
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

                                    {/* Aggiungi al Piano */}
                                    <div className="mt-4 border-t border-slate-100 pt-4">
                                        {(() => {
                                            const giaInPiano = pianoPieno.find(p => p.proposta_id === item.id);
                                            return giaInPiano ? (
                                                <div className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-black flex items-center justify-center gap-2">
                                                    <Calendar size={13} /> In piano: {labelGiorno(giaInPiano.giorno)} alle {giaInPiano.ora_inizio.slice(0,5)}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setPianoOraInizio('10:00');
                                                        setPianoOraFine('');
                                                        setPianoLuogo('');
                                                        setPianoNote('');
                                                        setPianoGiorno('2026-04-18');
                                                        setAddingToPiano(item.id);
                                                        avviaCercaLuogoAuto(item.titolo);
                                                    }}
                                                    className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all">
                                                    <Calendar size={13} /> Aggiungi al Piano
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* MODAL PIANO — fullscreen stile minute */}
            {isPianoOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom-6 duration-300">
                    <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white px-6 shrink-0"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-white/60">
                                <Calendar size={14} />
                                <p className="text-xs font-black uppercase tracking-widest">Amsterdam 18–20 Aprile</p>
                            </div>
                            <button onClick={() => setIsPianoOpen(false)}
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-black leading-snug tracking-tight pb-3">📅 Piano Viaggio</h2>
                        <div className="pb-4 border-t border-white/10 pt-3">
                            <p className="text-white/60 text-xs">Attività ordinate per orario. I tempi di percorrenza vengono calcolati su richiesta.</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6"
                        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                        {giorni.map(giorno => {
                            const slotGiorno = pianoPieno
                                .filter(p => p.giorno === giorno)
                                .sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio));

                            return (
                                <div key={giorno}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black">
                                            {labelGiorno(giorno)}
                                        </div>
                                        <div className="flex-1 h-px bg-slate-200"/>
                                        <span className="text-xs text-slate-400 font-bold">{slotGiorno.length} attività</span>
                                    </div>

                                    {slotGiorno.length === 0 ? (
                                        <div className="text-center py-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-300 text-sm font-bold">Nessuna attività pianificata</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {slotGiorno.map((slot, idx) => {
                                                const next = slotGiorno[idx + 1];
                                                const trattaKey = next ? `${slot.id}-${next.id}` : null;
                                                const daCercare = slot.luogo || slot.proposte?.titolo;
                                                const aCercare = next ? (next.luogo || next.proposte?.titolo) : null;

                                                return (
                                                    <div key={slot.id}>
                                                        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Clock size={12} className="text-emerald-500 shrink-0"/>
                                                                        <span className="text-xs font-black text-emerald-600">
                                                                            {slot.ora_inizio.slice(0,5)}
                                                                            {slot.ora_fine ? ` → ${slot.ora_fine.slice(0,5)}` : ''}
                                                                        </span>
                                                                    </div>
                                                                    <p className="font-black text-slate-800 text-sm leading-tight">
                                                                        {slot.proposte?.titolo || '—'}
                                                                    </p>
                                                                    {slot.luogo && (
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <MapPin size={10} className="text-slate-400"/>
                                                                            <p className="text-xs text-slate-400">{slot.luogo}</p>
                                                                        </div>
                                                                    )}
                                                                    {slot.note && (
                                                                        <p className="text-xs text-slate-400 mt-1 italic">{slot.note}</p>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => rimuoviDaPiano(slot.id)}
                                                                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all shrink-0">
                                                                    <X size={14}/>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {next && (
                                                            <div className="flex items-center gap-2 py-2 px-2">
                                                                {tratte[trattaKey!] ? (
                                                                    <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <span className="text-xs font-black text-blue-600">🚶 {tratte[trattaKey!].piedi}</span>
                                                                            <span className="text-xs font-black text-indigo-600">🚌 {tratte[trattaKey!].mezzi}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => calcolaTratta(trattaKey!, daCercare, aCercare)}
                                                                        disabled={loadingTratte[trattaKey!] || !daCercare || !aCercare}
                                                                        className="flex-1 py-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40">
                                                                        {loadingTratte[trattaKey!]
                                                                            ? <span className="animate-pulse">Calcolo...</span>
                                                                            : <><Navigation size={11}/> Calcola percorso</>
                                                                        }
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* BOTTOM-SHEET: Aggiungi al Piano */}
            {addingToPiano !== null && (
                <div className="fixed inset-0 z-[110]" onClick={() => setAddingToPiano(null)}>
                    {/* Overlay scuro */}
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />

                    {/* Sheet dal basso */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
                        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-300 rounded-full" />
                        </div>

                        <div className="px-6 pb-4 space-y-3">
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                                📅 Aggiungi al Piano
                            </p>
                            <p className="text-sm font-bold text-slate-700 -mt-1">
                                {listaProposte.find(p => p.id === addingToPiano)?.titolo}
                            </p>

                            {/* Giorni */}
                            <div className="grid grid-cols-3 gap-2">
                                {giorni.map(g => (
                                    <button key={g}
                                        onClick={() => setPianoGiorno(g)}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all ${pianoGiorno === g ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {labelGiorno(g).split(' ').slice(0, 2).join(' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Orari */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inizio</label>
                                    <input type="time" value={pianoOraInizio}
                                        onChange={e => setPianoOraInizio(e.target.value)}
                                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:ring-2 ring-emerald-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fine (opz.)</label>
                                    <input type="time" value={pianoOraFine}
                                        onChange={e => setPianoOraFine(e.target.value)}
                                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:ring-2 ring-emerald-400" />
                                </div>
                            </div>

                            {/* Luogo */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    <MapPin size={10} className="inline -mt-0.5 mr-0.5" /> Luogo / Indirizzo
                                </label>

                                {/* Campo già compilato — mostra il valore con possibilità di cambiare */}
                                {pianoLuogo ? (
                                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <MapPin size={14} className="text-emerald-600 shrink-0" />
                                        <p className="text-sm font-bold text-emerald-800 flex-1 leading-tight">{pianoLuogo}</p>
                                        <button onClick={() => { setPianoLuogo(''); setLuogoQuery(''); setLuogoRisultati([]); }}
                                            className="p-1 text-emerald-400 hover:text-red-500 transition-colors shrink-0">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Barra di ricerca */}
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Cerca un luogo ad Amsterdam..."
                                                value={luogoQuery}
                                                onChange={e => setLuogoQuery(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') cercaLuogo(luogoQuery); }}
                                                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base outline-none focus:ring-2 ring-emerald-400" />
                                            <button onClick={() => cercaLuogo(luogoQuery)}
                                                disabled={!luogoQuery.trim() || luogoLoading}
                                                className="px-3 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:bg-slate-200 disabled:text-slate-400 active:scale-95 transition-all shrink-0">
                                                {luogoLoading ? '...' : <Search size={16} />}
                                            </button>
                                        </div>

                                        {/* Risultati ricerca */}
                                        {luogoLoading && (
                                            <div className="flex items-center justify-center gap-2 py-3">
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-500" />
                                                <span className="text-xs text-slate-400 font-bold">Cerco su Google Maps...</span>
                                            </div>
                                        )}

                                        {!luogoLoading && luogoRisultati.length > 0 && (
                                            <div className="mt-2 space-y-1.5 max-h-[180px] overflow-y-auto rounded-xl">
                                                {luogoRisultati.map((r: any, i: number) => (
                                                    <button key={i}
                                                        onClick={() => {
                                                            setPianoLuogo(`${r.nome}, ${r.indirizzo}`);
                                                            setLuogoRisultati([]);
                                                        }}
                                                        className="w-full text-left p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-[0.98]">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-800 leading-tight">{r.nome}</p>
                                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{r.indirizzo}</p>
                                                            </div>
                                                            {r.rating && (
                                                                <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md shrink-0">⭐ {r.rating}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {!luogoLoading && luogoRisultati.length === 0 && luogoQuery.trim() && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-xs text-slate-400 text-center py-1">Nessun risultato trovato</p>
                                            </div>
                                        )}

                                        {/* Pulsante fallback Google Maps */}
                                        <button
                                            onClick={() => {
                                                const q = luogoQuery.trim() || listaProposte.find(p => p.id === addingToPiano)?.titolo || '';
                                                window.open(`https://www.google.com/maps/search/${encodeURIComponent(q + ' Amsterdam')}`, '_blank');
                                            }}
                                            className="w-full mt-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                                            <Navigation size={12} /> Cerca su Google Maps
                                        </button>
                                    </>
                                )}

                                {/* Input manuale sempre disponibile se vuole scrivere a mano */}
                                {!pianoLuogo && (
                                    <button
                                        onClick={() => {
                                            const addr = prompt('Inserisci indirizzo manualmente:');
                                            if (addr?.trim()) setPianoLuogo(addr.trim());
                                        }}
                                        className="w-full mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors text-center">
                                        ✏️ Oppure inserisci manualmente
                                    </button>
                                )}
                            </div>

                            {/* Bottoni */}
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setAddingToPiano(null)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold">
                                    Annulla
                                </button>
                                <button onClick={() => aggiungiAPiano(addingToPiano)}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                                    ✅ Conferma
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}