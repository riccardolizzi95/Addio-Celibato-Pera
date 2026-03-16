'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Trash2, Pencil, X } from 'lucide-react';

export default function AttivitaPage() {
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [titolo, setTitolo] = useState("");
    const [descrizione, setDescrizione] = useState("");
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
                const currentUrl = window.location.pathname + window.location.search;
                window.location.assign(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
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
    };

    const apriModifica = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setTitolo(item.titolo);
        setDescrizione(item.descrizione || "");
        setIsFormOpen(true);
        setExpandedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const salvaProposte = async () => {
        if (!titolo.trim()) return mostraFeedback("Inserisci almeno un titolo!", 'error');
        setIsLoadingAction(true);

        if (editingId) {
            const { error } = await supabase
                .from('proposte')
                .update({ titolo: titolo.trim(), descrizione: descrizione.trim() })
                .eq('id', editingId);
            if (error) mostraFeedback("Errore durante la modifica.", 'error');
            else { mostraFeedback("Proposta aggiornata! ✅", 'success'); resetForm(); scaricaDati(); }
        } else {
            const { error } = await supabase
                .from('proposte')
                .insert([{ titolo: titolo.trim(), descrizione: descrizione.trim(), creatore: myUsername || 'Anonimo', user_id: userId }]);
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
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-400 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                            {editingId ? '✏️ Modifica Proposta' : '🚀 Nuova Proposta'}
                        </p>
                        <input
                            type="text"
                            placeholder="Titolo"
                            className="w-full p-4 border rounded-xl mb-3 bg-slate-50 font-bold outline-none focus:ring-2 ring-blue-500"
                            value={titolo}
                            onChange={e => setTitolo(e.target.value)}
                        />
                        <textarea
                            placeholder="Descrizione (opzionale)..."
                            className="w-full p-4 border rounded-xl mb-4 bg-slate-50 min-h-[100px] outline-none focus:ring-2 ring-blue-500"
                            value={descrizione}
                            onChange={e => setDescrizione(e.target.value)}
                        />
                        <div className="flex gap-2">
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

                            {/* Header card */}
                            <div className="p-5 flex justify-between items-start">
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <h3 className="font-bold text-xl text-slate-800">{item.titolo}</h3>
                                    <p className="text-xs text-slate-400 mt-1">Da: {item.creatore}</p>
                                </div>

                                {/* Azioni visibili solo all'autore */}
                                {isMia && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            onClick={e => apriModifica(item, e)}
                                            className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                            title="Modifica proposta"
                                        >
                                            <Pencil size={17} />
                                        </button>
                                        <button
                                            onClick={e => eliminaProposta(item.id, e)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            title="Elimina proposta"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sezione espansa: descrizione + voti */}
                            {isExpanded && (
                                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                                    {item.descrizione?.trim() !== "" && (
                                        <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm whitespace-pre-wrap mb-6">
                                            {item.descrizione}
                                        </div>
                                    )}
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