'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Users, MessageSquare, CheckCircle, Trash2, X, Send, Edit3, Plus, ListTodo, UserPlus, Clock, Calendar } from 'lucide-react';

export default function MinutePage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [selectedMinuta, setSelectedMinuta] = useState<any | null>(null);

    const [titolo, setTitolo] = useState("");
    const [dataIncontro, setDataIncontro] = useState(new Date().toISOString().split('T')[0]);
    const [argomenti, setArgomenti] = useState("");
    const [decisioni, setDecisioni] = useState("");
    const [nuovoPartecipante, setNuovoPartecipante] = useState("");
    const [listaPartecipanti, setListaPartecipanti] = useState<string[]>([]);
    const [passiList, setPassiList] = useState<any[]>([]);
    const [listaMinute, setListaMinute] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const scaricaMinute = async () => {
        const { data, error } = await supabase.from('minute').select('*, prossimi_passi (*)').order('data_incontro', { ascending: false });
        if (!error && data) {
            setListaMinute(data);
            const params = new URLSearchParams(window.location.search);
            const idToOpen = params.get('id');
            if (idToOpen) {
                const found = data.find((m: any) => m.id === idToOpen);
                if (found) setSelectedMinuta(found);
            }
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                return;
            }
            const { data: profilo } = await supabase.from('profili').select('admin').eq('id', session.user.id).single();
            if (profilo?.admin) setIsAdmin(true);
            setLoading(false);
            scaricaMinute();
        };
        checkUser();
    }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const aggiungiPartecipante = () => {
        if (!nuovoPartecipante.trim()) return;
        setListaPartecipanti([...listaPartecipanti, nuovoPartecipante.trim()]);
        setNuovoPartecipante("");
    };

    const rimuoviPartecipante = (index: number) => {
        setListaPartecipanti(listaPartecipanti.filter((_, i) => i !== index));
    };

    const avviaModifica = (e: React.MouseEvent, minuta: any) => {
        e.stopPropagation();
        setEditId(minuta.id);
        setTitolo(minuta.titolo);
        setDataIncontro(minuta.data_incontro);
        setArgomenti(minuta.argomenti || "");
        setDecisioni(minuta.decisioni || "");
        setListaPartecipanti(minuta.partecipanti ? minuta.partecipanti.split('; ') : []);
        setPassiList(minuta.prossimi_passi || []);
        setIsEditing(true);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const salvaMinuta = async () => {
        if (!titolo || !dataIncontro) return mostraFeedback("Titolo e Data sono obbligatori!", 'error');
        const { data: { user } } = await supabase.auth.getUser();
        const payloadMinuta = {
            titolo, data_incontro: dataIncontro,
            partecipanti: listaPartecipanti.join('; '),
            argomenti, decisioni, user_id: user?.id
        };
        let resultMinuta;
        if (isEditing && editId) {
            resultMinuta = await supabase.from('minute').update(payloadMinuta).eq('id', editId).select().single();
            await supabase.from('prossimi_passi').delete().eq('minuta_id', editId);
        } else {
            resultMinuta = await supabase.from('minute').insert([payloadMinuta]).select().single();
        }
        if (resultMinuta.error) return mostraFeedback("Errore nel salvataggio.", 'error');
        if (passiList.length > 0) {
            const passiFinali = passiList.map(p => ({
                titolo: p.titolo, scadenza: p.scadenza || null,
                responsabili: p.responsabili, minuta_id: resultMinuta.data.id, user_id: user?.id
            }));
            await supabase.from('prossimi_passi').insert(passiFinali);
        }
        mostraFeedback(isEditing ? "Verbale aggiornato! ✅" : "Verbale salvato! 🍐", 'success');
        resetForm();
        scaricaMinute();
    };

    const resetForm = () => {
        setIsFormOpen(false); setIsEditing(false); setEditId(null);
        setTitolo(""); setArgomenti(""); setDecisioni("");
        setListaPartecipanti([]); setPassiList([]);
        setDataIncontro(new Date().toISOString().split('T')[0]);
    };

    const condividiWhatsApp = (e: React.MouseEvent, minuta: any) => {
        e.stopPropagation();
        const dataFormattata = new Date(minuta.data_incontro).toLocaleDateString('it-IT');
        const urlApp = `${window.location.origin}/minute?id=${minuta.id}`;
        const presenti = minuta.partecipanti?.split('; ').join(', ') || 'Nessuno specificato';
        const passiTesto = minuta.prossimi_passi?.length > 0
            ? minuta.prossimi_passi.map((p: any) => `- ${p.titolo}${p.responsabili ? ` (Resp: ${p.responsabili})` : ''}`).join('\n')
            : 'Nessun task previsto';
        const messaggio =
            `*MISSIONE PERA - VERBALE DI INCONTRO*\n------------------------------------\n\n` +
            `*DATA:* ${dataFormattata}\n*TITOLO:* ${minuta.titolo}\n*PRESENTI:* ${presenti}\n\n` +
            `*DISCUSSIONE:*\n${minuta.argomenti || 'Nessun dettaglio'}\n\n` +
            `*DECISIONI FINALI:*\n_${minuta.decisioni || 'Nessuna decisione'}_\n\n` +
            `*PROSSIMI PASSI:*\n${passiTesto}\n\n------------------------------------\n\n` +
            `*APRI NELL'APP:*\n${urlApp}\n\n` +
            `_Se non sei ancora registrato, condividi qui la tua mail._`;
        window.open(`https://wa.me/?text=${encodeURIComponent(messaggio)}`, '_blank');
    };

    const toggleCompletato = async (passoId: string, completato: boolean) => {
        await supabase.from('prossimi_passi').update({ completato: !completato }).eq('id', passoId);
        // Aggiorno selectedMinuta localmente per risposta immediata
        setSelectedMinuta((prev: any) => ({
            ...prev,
            prossimi_passi: prev.prossimi_passi.map((p: any) =>
                p.id === passoId ? { ...p, completato: !completato } : p
            )
        }));
        // Ricarico anche la lista per aggiornare i contatori
        scaricaMinute();
    };

    const formatDataLunga = (d: string) =>
        new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">

            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-blue-600 font-bold text-sm">← Home</Link>
                    <h1 className="text-lg font-black tracking-tight">Verbali 🍐</h1>
                    <div className="w-12" /> {/* spacer */}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">

                {/* Pulsante nuovo verbale / form */}
                {isAdmin && (
                    <>
                        <button
                            onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
                            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 border-dashed ${isFormOpen ? 'border-slate-300 text-slate-400 bg-white' : 'border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                        >
                            {isFormOpen ? <X size={16} /> : <Plus size={16} />}
                            {isFormOpen ? 'Annulla' : '+ Scrivi nuovo verbale'}
                        </button>

                        {isFormOpen && (
                            <div className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                {/* Form header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                                    <p className="text-white font-black text-sm uppercase tracking-widest">
                                        {isEditing ? '✏️ Modifica Verbale' : '📋 Nuovo Verbale'}
                                    </p>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Data + Titolo */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data</label>
                                            <input type="date"
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-400 text-sm font-bold"
                                                value={dataIncontro} onChange={e => setDataIncontro(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Titolo</label>
                                            <input type="text" placeholder="Es: Riunione voli"
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-400 text-sm font-bold"
                                                value={titolo} onChange={e => setTitolo(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Partecipanti */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Partecipanti</label>
                                        <div className="flex gap-2 mb-3">
                                            <input type="text" placeholder="Aggiungi nome..."
                                                className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-400 text-sm"
                                                value={nuovoPartecipante}
                                                onChange={e => setNuovoPartecipante(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && aggiungiPartecipante()} />
                                            <button onClick={aggiungiPartecipante}
                                                className="px-4 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-100 active:scale-95 transition-all">
                                                <UserPlus size={18} />
                                            </button>
                                        </div>
                                        {listaPartecipanti.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {listaPartecipanti.map((p, i) => (
                                                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-100">
                                                        {p}
                                                        <X size={12} className="cursor-pointer text-blue-300 hover:text-red-400 transition-colors" onClick={() => rimuoviPartecipante(i)} />
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Argomenti */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Discussione / Argomenti</label>
                                        <textarea placeholder="Di cosa avete parlato?"
                                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-400 min-h-[100px] text-sm leading-relaxed"
                                            value={argomenti} onChange={e => setArgomenti(e.target.value)} />
                                    </div>

                                    {/* Decisioni */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Decisioni Finali</label>
                                        <textarea placeholder="Cosa avete deciso?"
                                            className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:ring-2 ring-emerald-400 min-h-[80px] font-bold text-emerald-900 text-sm"
                                            value={decisioni} onChange={e => setDecisioni(e.target.value)} />
                                    </div>

                                    {/* Prossimi passi */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ListTodo size={13} /> Prossimi Passi
                                            </label>
                                            <button
                                                onClick={() => setPassiList([...passiList, { titolo: "", scadenza: "", responsabili: "" }])}
                                                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all">
                                                <Plus size={13} /> Aggiungi task
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {passiList.map((passo, index) => (
                                                <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                                                    <button onClick={() => setPassiList(passiList.filter((_, i) => i !== index))}
                                                        className="absolute top-3 right-3 text-slate-300 hover:text-red-400 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                    <input type="text" placeholder="Cosa fare?"
                                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm mb-2.5 font-bold outline-none focus:ring-2 ring-blue-400"
                                                        value={passo.titolo}
                                                        onChange={e => { const nl = [...passiList]; nl[index].titolo = e.target.value; setPassiList(nl); }} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="date"
                                                            className="bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:ring-2 ring-blue-400"
                                                            value={passo.scadenza}
                                                            onChange={e => { const nl = [...passiList]; nl[index].scadenza = e.target.value; setPassiList(nl); }} />
                                                        <input type="text" placeholder="Responsabili"
                                                            className="bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:ring-2 ring-blue-400"
                                                            value={passo.responsabili}
                                                            onChange={e => { const nl = [...passiList]; nl[index].responsabili = e.target.value; setPassiList(nl); }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={salvaMinuta}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">
                                        {isEditing ? "Aggiorna Verbale" : "Salva Verbale 🍐"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Lista verbali */}
                {listaMinute.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-5xl mb-3">📋</p>
                        <p className="text-slate-400 font-bold">Nessun verbale ancora scritto.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {listaMinute.map((minuta, idx) => {
                        const dataFormatted = formatDataLunga(minuta.data_incontro);
                        const presenti = minuta.partecipanti?.split('; ').filter(Boolean) || [];
                        const nPassi = minuta.prossimi_passi?.length || 0;

                        return (
                            <div key={minuta.id}
                                onClick={() => setSelectedMinuta(minuta)}
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group overflow-hidden">

                                {/* Striscia colorata top — colore alternato */}
                                <div className={`h-1 w-full ${idx % 3 === 0 ? 'bg-blue-500' : idx % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                                <div className="p-5">
                                    {/* Header riga */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{dataFormatted}</p>
                                            </div>
                                            <h2 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{minuta.titolo}</h2>
                                        </div>

                                        {/* Azioni admin */}
                                        <div className="flex items-center gap-0.5 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                            {isAdmin && (
                                                <>
                                                    <button onClick={e => condividiWhatsApp(e, minuta)}
                                                        className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Condividi su WhatsApp">
                                                        <Send size={16} />
                                                    </button>
                                                    <button onClick={e => avviaModifica(e, minuta)}
                                                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Modifica">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={async e => {
                                                        e.stopPropagation();
                                                        await supabase.from('minute').delete().eq('id', minuta.id);
                                                        scaricaMinute();
                                                    }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Elimina">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Decisione highlight */}
                                    {minuta.decisioni && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-4">
                                            <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">Decisione</p>
                                            <p className="text-sm text-emerald-900 font-bold line-clamp-2">{minuta.decisioni}</p>
                                        </div>
                                    )}

                                    {/* Footer riga: presenti + task */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {presenti.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Users size={13} />
                                                    <span className="text-xs font-bold">{presenti.length} presenti</span>
                                                </div>
                                            )}
                                            {nPassi > 0 && (
                                                <div className="flex items-center gap-1.5 text-blue-400">
                                                    <ListTodo size={13} />
                                                    <span className="text-xs font-bold">{nPassi} task</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-300 font-bold group-hover:text-blue-400 transition-colors">
                                            Apri →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DETTAGLIO */}
            {selectedMinuta && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end justify-center"
                    onClick={() => { setSelectedMinuta(null); window.history.replaceState({}, '', '/minute'); }}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300"
                        style={{ maxHeight: '92dvh' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal header con pill */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 pt-2 pb-5 shrink-0">
                            <div className="flex justify-center mb-2">
                                <div className="w-10 h-1 bg-white/20 rounded-full" />
                            </div>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 text-white/50">
                                    <Calendar size={13} />
                                    <p className="text-xs font-black uppercase tracking-widest">
                                        {formatDataLunga(selectedMinuta.data_incontro)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedMinuta(null); window.history.replaceState({}, '', '/minute'); }}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <h2 className="text-3xl font-black leading-tight tracking-tight">{selectedMinuta.titolo}</h2>

                            {/* Presenti — riga singola scorrevole, compatta */}
                            {selectedMinuta.partecipanti && (
                                <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
                                    <Users size={12} className="text-white/40 shrink-0" />
                                    <p className="text-white/70 text-xs font-bold whitespace-nowrap">
                                        {selectedMinuta.partecipanti.split('; ').filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal body — scrollabile, occupa lo spazio disponibile */}
                        <div className="flex-1 overflow-y-auto p-7 space-y-5 pb-safe">

                            {/* Discussione */}
                            {selectedMinuta.argomenti && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare size={15} className="text-blue-500" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discussione</h4>
                                    </div>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                        {selectedMinuta.argomenti}
                                    </p>
                                </div>
                            )}

                            {/* Decisioni */}
                            <div className="bg-emerald-500/10 border border-emerald-200 px-4 py-3 rounded-2xl">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <CheckCircle size={13} className="text-emerald-600" />
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Decisioni Finali</h4>
                                </div>
                                <p className="text-sm font-bold text-emerald-900 leading-relaxed">
                                    {selectedMinuta.decisioni || 'Nessuna decisione registrata'}
                                </p>
                            </div>

                            {/* Prossimi passi */}
                            {selectedMinuta.prossimi_passi?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListTodo size={15} className="text-blue-500" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prossimi Passi</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedMinuta.prossimi_passi.map((passo: any, i: number) => (
                                            <div key={passo.id}
                                                className={`border p-3.5 rounded-2xl flex items-start gap-3 transition-all ${passo.completato ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                {/* Spunta completato */}
                                                <button
                                                    onClick={() => toggleCompletato(passo.id, passo.completato)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all active:scale-90 ${passo.completato ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {passo.completato && <CheckCircle size={14} strokeWidth={3} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-sm mb-1 transition-all ${passo.completato ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                        {passo.titolo}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {passo.scadenza && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${passo.completato ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'}`}>
                                                                <Clock size={9} /> {new Date(passo.scadenza).toLocaleDateString('it-IT')}
                                                            </span>
                                                        )}
                                                        {passo.responsabili && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${passo.completato ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                <Users size={9} /> {passo.responsabili}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}