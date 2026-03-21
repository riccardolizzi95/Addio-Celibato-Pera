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
        scaricaPiano();
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
    };

    const apriModifica = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setTitolo(item.titolo);
        setDescrizione(item.descrizione || "");
        setCostoStimato(item.costo_stimato != null ? String(item.costo_stimato) : "");
        setMaxPartecipanti(item.max_partecipanti != null ? String(item.max_partecipanti) : "");
        setIsFormOpen(true);
        setExpandedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scaricaPiano = async () => {
        const { data } = await supabase
            .from('piano_attivita')
            .select('*, proposte(id, titolo, luogo)')
            .order('giorno').order('ordine').order('ora_inizio');
        if (data) setPianoPieno(data);
    };

    const aggiungiAPiano = async (propostaId: number) => {
        if (!pianoOraInizio) return;
        const { data: { user } } = await supabase.auth.getUser();
        const existing = pianoPieno.filter(p => p.giorno === pianoGiorno);
        await supabase.from('piano_attivita').insert([{
            proposta_id: propostaId,
            giorno: pianoGiorno,
            ora_inizio: pianoOraInizio,
            ora_fine: pianoOraFine || null,
            luogo: pianoLuogo || null,
            note: pianoNote || null,
            ordine: existing.length,
            user_id: user?.id,
        }]);
        mostraFeedback('Aggiunta al piano! ✅', 'success');
        setAddingToPiano(null);
        setPianoOraInizio('10:00'); setPianoOraFine(''); setPianoLuogo(''); setPianoNote('');
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
            const query = encodeURIComponent(`${da} Amsterdam`);
            const dest = encodeURIComponent(`${a} Amsterdam`);
            // Chiamiamo route.ts server-side per non esporre la key
            const res = await fetch(`/api/tratta?da=${query}&a=${dest}`);
            if (res.ok) {
                const dati = await res.json();
                setTratte(prev => ({ ...prev, [key]: dati }));
            }
        } catch {}
        setLoadingTratte(prev => ({ ...prev, [key]: false }));
    };

    const giorni = ['2026-04-18', '2026-04-19', '2026-04-20'];
    const labelGiorno = (d: string) => {
        const map: Record<string, string> = {
            '2026-04-18': 'Sab 18 Aprile',
            '2026-04-19': 'Dom 19 Aprile',
            '2026-04-20': 'Lun 20 Aprile',
        };
        return map[d] || d;
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
                            onClick={() => setIsPianoOpen(true)}
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
                                        href={`https://www.google.com/search?q=${encodeURIComponent(item.titolo + ' Amsterdam cosa fare')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full mb-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Search size={14} /> Cerca su Google
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

            {/* ── MODAL PIANO — fullscreen stile minute ── */}
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
                            <p className="text-white/60 text-xs">Trascina le attività per riordinarle. I tempi di percorrenza vengono calcolati automaticamente.</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6"
                        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

                        {giorni.map(giorno => {
                            const slotGiorno = pianoPieno.filter(p => p.giorno === giorno)
                                .sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio));

                            return (
                                <div key={giorno}>
                                    {/* Header giorno */}
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
                                                        {/* Card attività */}
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

                                                        {/* Tratta verso prossima attività */}
                                                        {next && (
                                                            <div className="flex items-center gap-2 py-2 px-4">
                                                                <div className="w-px h-full bg-slate-200 mx-2"/>
                                                                {tratte[trattaKey!] ? (
                                                                    <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <span className="text-xs font-black text-blue-600 flex items-center gap-1">
                                                                                🚶 {tratte[trattaKey!].piedi}
                                                                            </span>
                                                                            <span className="text-xs font-black text-indigo-600 flex items-center gap-1">
                                                                                🚌 {tratte[trattaKey!].mezzi}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400">
                                                                                {tratte[trattaKey!].da} → {tratte[trattaKey!].a}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => calcolaTratta(trattaKey!, daCercare, aCercare)}
                                                                        disabled={loadingTratte[trattaKey!] || !daCercare || !aCercare}
                                                                        className="flex-1 py-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40">
                                                                        {loadingTratte[trattaKey!]
                                                                            ? <span className="animate-spin">⏳</span>
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
            </div>
                </div>
        </main>
    );
}