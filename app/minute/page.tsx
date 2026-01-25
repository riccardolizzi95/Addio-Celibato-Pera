'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, MessageSquare, CheckCircle, Trash2, X, ChevronRight, Send, Edit3, Plus, ListTodo, UserPlus, Clock } from 'lucide-react';

export default function MinutePage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [selectedMinuta, setSelectedMinuta] = useState<any | null>(null);

    // Stati Form Minuta
    const [titolo, setTitolo] = useState("");
    const [dataIncontro, setDataIncontro] = useState(new Date().toISOString().split('T')[0]);
    const [argomenti, setArgomenti] = useState("");
    const [decisioni, setDecisioni] = useState("");

    // Gestione Partecipanti a Lista
    const [nuovoPartecipante, setNuovoPartecipante] = useState("");
    const [listaPartecipanti, setListaPartecipanti] = useState<string[]>([]);

    // Stato per i Prossimi Passi (Senza Punti)
    const [passiList, setPassiList] = useState<any[]>([]);

    const [listaMinute, setListaMinute] = useState<any[]>([]);
    const router = useRouter();

    const scaricaMinute = async () => {
        const { data, error } = await supabase
            .from('minute')
            .select('*, prossimi_passi (*)')
            .order('data_incontro', { ascending: false });

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
            // Usiamo getUser() invece di getSession() perché è più preciso nel verificare l'autenticità reale
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Se non c'è l'utente, lo mandiamo al login passandogli l'URL attuale
                const currentUrl = window.location.pathname + window.location.search;
                return router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
            }

            const { data: profilo } = await supabase.from('profili').select('admin').eq('id', user.id).single();
            if (profilo?.admin) setIsAdmin(true);
            setLoading(false);
            scaricaMinute();
        };
        checkUser();
    }, [router]);

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
    };

    const salvaMinuta = async () => {
        if (!titolo || !dataIncontro) return alert("Titolo e Data sono obbligatori!");
        const { data: { user } } = await supabase.auth.getUser();

        const payloadMinuta = {
            titolo,
            data_incontro: dataIncontro,
            partecipanti: listaPartecipanti.join('; '),
            argomenti,
            decisioni,
            user_id: user?.id
        };

        let resultMinuta;
        if (isEditing && editId) {
            resultMinuta = await supabase.from('minute').update(payloadMinuta).eq('id', editId).select().single();
            await supabase.from('prossimi_passi').delete().eq('minuta_id', editId);
        } else {
            resultMinuta = await supabase.from('minute').insert([payloadMinuta]).select().single();
        }

        if (resultMinuta.error) return alert("Errore nel salvataggio");

        if (passiList.length > 0) {
            const passiFinali = passiList.map(p => ({
                titolo: p.titolo,
                scadenza: p.scadenza || null,
                responsabili: p.responsabili,
                minuta_id: resultMinuta.data.id,
                user_id: user?.id
            }));
            await supabase.from('prossimi_passi').insert(passiFinali);
        }

        resetForm();
        scaricaMinute();
    };

    const resetForm = () => {
        setIsFormOpen(false); setIsEditing(false); setEditId(null);
        setTitolo(""); setArgomenti(""); setDecisioni(""); setListaPartecipanti([]); setPassiList([]);
        setDataIncontro(new Date().toISOString().split('T')[0]);
    };

    const condividiWhatsApp = (e: React.MouseEvent, minuta: any) => {
        e.stopPropagation();

        const dataFormattata = new Date(minuta.data_incontro).toLocaleDateString('it-IT');
        const urlApp = `${window.location.origin}/minute?id=${minuta.id}`;

        // Pulizia dei partecipanti per il messaggio
        const presenti = minuta.partecipanti?.split('; ').join(', ') || 'Nessuno specificato';

        // Formattazione della lista dei Prossimi Passi
        const passiTesto = minuta.prossimi_passi?.length > 0
            ? minuta.prossimi_passi.map((p: any) => `- ${p.titolo}${p.responsabili ? ` (Resp: ${p.responsabili})` : ''}`).join('\n')
            : 'Nessun task previsto';

        const messaggio =
            `*MISSIONE PERA - VERBALE DI INCONTRO*\n` +
            `------------------------------------\n\n` +
            `*DATA:* ${dataFormattata}\n` +
            `*TITOLO:* ${minuta.titolo}\n` +
            `*PRESENTI:* ${presenti}\n\n` +
            `*DISCUSSIONE:*\n${minuta.argomenti || 'Nessun dettaglio inserito'}\n\n` +
            `*DECISIONI FINALI:*\n_${minuta.decisioni || 'Nessuna decisione registrata'}_\n\n` +
            `*PROSSIMI PASSI:*\n${passiTesto}\n\n` +
            `------------------------------------\n\n` +
            `*APRI IL DETTAGLIO NELL'APP:*\n` +
            `${urlApp}\n\n` +
            `_Se non sei ancora registrato, per favore condividi qui la tua mail in modo che io possa creare la tua utenza._`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messaggio)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) return <div className="p-10 text-center font-bold bg-slate-50 min-h-screen italic">Preparazione missione...</div>;

    return (
        <main className="min-h-screen bg-slate-50 p-6 pb-20 text-slate-900">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-blue-600 font-bold hover:underline">← Home</Link>
                    <h1 className="text-2xl font-black italic tracking-tight">Minute Incontri</h1>
                </div>

                {isAdmin && (
                    <button onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)} className="w-full mb-8 bg-white border-2 border-dashed border-slate-300 p-5 rounded-2xl text-slate-500 font-bold shadow-sm hover:border-blue-400 transition-all">
                        {isFormOpen ? "Annulla" : "+ Scrivi nuovo verbale"}
                    </button>
                )}

                {isFormOpen && (
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 mb-10 space-y-4 animate-in zoom-in duration-300">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none border" value={dataIncontro} onChange={e => setDataIncontro(e.target.value)} />
                            <input type="text" placeholder="Titolo incontro" className="p-3 bg-slate-50 rounded-xl outline-none border font-bold" value={titolo} onChange={e => setTitolo(e.target.value)} />
                        </div>

                        {/* PARTECIPANTI COME LISTA */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Partecipanti</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Aggiungi nome..." className="flex-1 p-3 bg-slate-50 rounded-xl border outline-none" value={nuovoPartecipante} onChange={e => setNuovoPartecipante(e.target.value)} onKeyPress={e => e.key === 'Enter' && aggiungiPartecipante()} />
                                <button onClick={aggiungiPartecipante} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><UserPlus size={20} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {listaPartecipanti.map((p, i) => (
                                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-100">
                                        {p} <X size={12} className="cursor-pointer text-blue-400" onClick={() => rimuoviPartecipante(i)} />
                                    </span>
                                ))}
                            </div>
                        </div>

                        <textarea placeholder="Di cosa abbiamo parlato? (Discussione)" className="w-full p-3 bg-slate-50 rounded-xl outline-none border min-h-[100px]" value={argomenti} onChange={e => setArgomenti(e.target.value)} />
                        <textarea placeholder="Decisioni Finali..." className="w-full p-3 bg-emerald-50 text-emerald-900 rounded-xl outline-none border min-h-[80px] font-bold" value={decisioni} onChange={e => setDecisioni(e.target.value)} />

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListTodo size={14} /> Prossimi Passi</label>
                                <button onClick={() => setPassiList([...passiList, { titolo: "", scadenza: "", responsabili: "" }])} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-slate-200 transition-all"><Plus size={14} /> Task</button>
                            </div>
                            <div className="space-y-3">
                                {passiList.map((passo, index) => (
                                    <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative animate-in slide-in-from-right-2 duration-200">
                                        <X size={14} className="absolute top-3 right-3 text-slate-300 cursor-pointer hover:text-red-500" onClick={() => setPassiList(passiList.filter((_, i) => i !== index))} />
                                        <input type="text" placeholder="Cosa fare?" className="w-full p-2 bg-white border rounded-lg text-sm mb-2 font-bold outline-none" value={passo.titolo} onChange={e => {
                                            const nl = [...passiList]; nl[index].titolo = e.target.value; setPassiList(nl);
                                        }} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" className="bg-white border rounded-lg p-2 text-[10px] outline-none" value={passo.scadenza} onChange={e => {
                                                const nl = [...passiList]; nl[index].scadenza = e.target.value; setPassiList(nl);
                                            }} />
                                            <input type="text" placeholder="Responsabili" className="bg-white border rounded-lg p-2 text-[10px] outline-none" value={passo.responsabili} onChange={e => {
                                                const nl = [...passiList]; nl[index].responsabili = e.target.value; setPassiList(nl);
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={salvaMinuta} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">{isEditing ? "Aggiorna Missione" : "Salva Tutto 🍐"}</button>
                    </div>
                )}

                <div className="space-y-4">
                    {listaMinute.map((minuta) => (
                        <div key={minuta.id} onClick={() => setSelectedMinuta(minuta)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-blue-600 font-bold text-[10px] mb-1 uppercase tracking-wider">{new Date(minuta.data_incontro).toLocaleDateString('it-IT')}</p>
                                    <h2 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{minuta.titolo}</h2>
                                </div>
                                <div className="flex gap-1">
                                    {isAdmin && (
                                        <>
                                            <button onClick={(e) => condividiWhatsApp(e, minuta)} className="p-2 text-slate-300 hover:text-emerald-500"><Send size={18} /></button>
                                            <button onClick={(e) => avviaModifica(e, minuta)} className="p-2 text-slate-300 hover:text-blue-500"><Edit3 size={18} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm("Eliminare?")) supabase.from('minute').delete().eq('id', minuta.id).then(() => scaricaMinute()); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                    <div className="p-2 text-slate-300"><ChevronRight size={20} /></div>
                                </div>
                            </div>

                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/50 mb-3">
                                <p className="text-sm text-emerald-900 font-bold line-clamp-2 italic">"{minuta.decisioni || 'Nessuna decisione'}"</p>
                            </div>

                            {/* ANTEPRIMA PROSSIMI PASSI NELLA LISTA */}
                            {minuta.prossimi_passi?.length > 0 && (
                                <div className="flex items-center gap-2 overflow-hidden border-t border-slate-50 pt-3">
                                    <ListTodo size={14} className="text-blue-400 shrink-0" />
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {minuta.prossimi_passi.map((p: any) => (
                                            <span key={p.id} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md whitespace-nowrap font-bold uppercase tracking-tighter">
                                                {p.titolo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* POP-UP DETTAGLIO RISTRUTTURATO */}
            {selectedMinuta && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* HEADER GRADIENT */}
                        <div className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Incontro del {new Date(selectedMinuta.data_incontro).toLocaleDateString('it-IT')}</p>
                                <h2 className="text-3xl font-black leading-tight tracking-tight">{selectedMinuta.titolo}</h2>
                            </div>
                            <button onClick={() => { setSelectedMinuta(null); router.replace('/minute'); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* PARTECIPANTI */}
                            <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
                                <Users className="text-blue-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presenti</h4>
                                    <p className="text-sm font-bold text-slate-700">{selectedMinuta.partecipanti?.split('; ').join(', ') || 'Nessuno specificato'}</p>
                                </div>
                            </div>

                            {/* DISCUSSIONE */}
                            <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
                                <MessageSquare className="text-blue-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discussione</h4>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedMinuta.argomenti || 'Nessun dettaglio inserito'}</p>
                                </div>
                            </div>

                            {/* DECISIONI (BLOCCO VERDE) */}
                            <div className="bg-emerald-500 p-6 rounded-[2rem] text-white flex gap-4 shadow-lg shadow-emerald-200">
                                <CheckCircle className="shrink-0 mt-1" size={22} />
                                <div>
                                    <h4 className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Decisioni Finali</h4>
                                    <p className="font-black text-xl leading-tight">{selectedMinuta.decisioni || 'Nessuna decisione'}</p>
                                </div>
                            </div>

                            {/* PROSSIMI PASSI (SENZA PUNTI) */}
                            {selectedMinuta.prossimi_passi?.length > 0 && (
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2"><ListTodo size={18} className="text-blue-600" /> Prossimi Passi</h4>
                                    <div className="grid gap-3">
                                        {selectedMinuta.prossimi_passi.map((passo: any) => (
                                            <div key={passo.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                                <p className="font-black text-slate-800 text-sm">{passo.titolo}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {passo.scadenza && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={10} /> {new Date(passo.scadenza).toLocaleDateString('it-IT')}</span>}
                                                    {passo.responsabili && <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg flex items-center gap-1"><Users size={10} /> {passo.responsabili}</span>}
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