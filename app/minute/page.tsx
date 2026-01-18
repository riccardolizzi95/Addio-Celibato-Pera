'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, MessageSquare, CheckCircle, Trash2, X, ChevronRight, Send } from 'lucide-react';

export default function MinutePage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMinuta, setSelectedMinuta] = useState<any | null>(null);

    const [titolo, setTitolo] = useState("");
    const [dataIncontro, setDataIncontro] = useState(new Date().toISOString().split('T')[0]);
    const [partecipanti, setPartecipanti] = useState("");
    const [argomenti, setArgomenti] = useState("");
    const [decisioni, setDecisioni] = useState("");

    const [listaMinute, setListaMinute] = useState<any[]>([]);
    const router = useRouter();

    const scaricaMinute = async () => {
        const { data, error } = await supabase
            .from('minute')
            .select('*')
            .order('data_incontro', { ascending: false });

        if (!error && data) {
            setListaMinute(data);

            // LOGICA DEEP LINK: Controlla se l'URL contiene un ID (?id=...)
            const params = new URLSearchParams(window.location.search);
            const idToOpen = params.get('id');
            if (idToOpen) {
                const found = data.find((m: any) => m.id === idToOpen);
                if (found) setSelectedMinuta(found);
            }
        }
    };

    useEffect(() => {
        const checkUserAndPermissions = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push('/login');

            const { data: profilo } = await supabase
                .from('profili')
                .select('admin')
                .eq('id', session.user.id)
                .single();

            if (profilo?.admin) setIsAdmin(true);

            setLoading(false);
            scaricaMinute();
        };
        checkUserAndPermissions();
    }, [router]);

    // --- FUNZIONE WHATSAPP SEMPLIFICATA (SOLO TESTO E FORMATTAZIONE WA) ---
    const condividiWhatsApp = (e: React.MouseEvent, minuta: any) => {
        e.stopPropagation();

        const dataFormattata = new Date(minuta.data_incontro).toLocaleDateString('it-IT');
        const urlApp = `${window.location.origin}/minute?id=${minuta.id}`;

        const messaggio =
            `*MISSIONE PERA - VERBALE DI INCONTRO*\n` +
            `------------------------------------\n\n` +
            `*DATA:* ${dataFormattata}\n` +
            `*TITOLO:* ${minuta.titolo}\n\n` +
            `*DECISIONI FINALI:*\n` +
            `_${minuta.decisioni || 'Nessuna decisione registrata'}_\n\n` +
            `------------------------------------\n\n` +
            `*APRI IL DETTAGLIO NELL'APP:*\n` +
            `${urlApp}\n\n` +
            `_Se non sei ancora registrato, per favore condividi qui la tua mail in modo che io possa creare la tua utenza._`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messaggio)}`;
        window.open(whatsappUrl, '_blank');
    };

    const salvaMinuta = async () => {
        if (!titolo || !dataIncontro) return alert("Titolo e Data sono obbligatori!");
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('minute').insert([{
            titolo, data_incontro: dataIncontro, partecipanti, argomenti, decisioni, user_id: user?.id
        }]);

        if (!error) {
            setIsFormOpen(false);
            setTitolo(""); setPartecipanti(""); setArgomenti(""); setDecisioni("");
            setDataIncontro(new Date().toISOString().split('T')[0]);
            scaricaMinute();
        }
    };

    const eliminaMinuta = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Vuoi davvero eliminare questo verbale?")) {
            const { error } = await supabase.from('minute').delete().eq('id', id);
            if (!error) scaricaMinute();
        }
    };

    if (loading) return <div className="p-10 text-center font-bold bg-slate-50 min-h-screen">Caricamento missione...</div>;

    return (
        <main className="min-h-screen bg-slate-50 p-6 pb-20 relative">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-blue-600 font-bold hover:underline">← Home</Link>
                    <h1 className="text-2xl font-black italic tracking-tight">Minute Incontri</h1>
                </div>

                {isAdmin ? (
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="w-full mb-8 bg-white border-2 border-dashed border-slate-300 p-5 rounded-2xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {isFormOpen ? "Chiudi Form" : <><span className="text-xl">+</span> Scrivi nuovo verbale</>}
                    </button>
                ) : (
                    <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-2xl text-center text-xs font-bold border border-blue-100">
                        Solo gli organizzatori possono gestire i verbali.
                    </div>
                )}

                {isFormOpen && (
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 mb-10 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none" value={dataIncontro} onChange={e => setDataIncontro(e.target.value)} />
                            <input type="text" placeholder="Titolo" className="p-3 bg-slate-50 rounded-xl outline-none" value={titolo} onChange={e => setTitolo(e.target.value)} />
                        </div>
                        <input type="text" placeholder="Partecipanti" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={partecipanti} onChange={e => setPartecipanti(e.target.value)} />
                        <textarea placeholder="Discussione..." className="w-full p-3 bg-slate-50 rounded-xl outline-none min-h-[80px]" value={argomenti} onChange={e => setArgomenti(e.target.value)} />
                        <textarea placeholder="Decisioni..." className="w-full p-3 bg-emerald-50 text-emerald-900 rounded-xl outline-none min-h-[80px] font-medium" value={decisioni} onChange={e => setDecisioni(e.target.value)} />
                        <button onClick={salvaMinuta} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">Salva Verbale 🍐</button>
                    </div>
                )}

                <div className="space-y-4">
                    {listaMinute.map((minuta) => (
                        <div key={minuta.id} onClick={() => setSelectedMinuta(minuta)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] mb-1">
                                        <Calendar size={12} />
                                        {new Date(minuta.data_incontro).toLocaleDateString('it-IT')}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800">{minuta.titolo}</h2>
                                    <p className="text-xs text-slate-400 mt-1">Con: {minuta.partecipanti}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAdmin && (
                                        <>
                                            <button onClick={(e) => condividiWhatsApp(e, minuta)} className="text-slate-200 hover:text-emerald-500 p-2"><Send size={18} /></button>
                                            <button onClick={(e) => eliminaMinuta(e, minuta.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                                </div>
                            </div>
                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/50">
                                <p className="text-sm text-emerald-900 font-bold line-clamp-2">{minuta.decisioni || "Nessuna decisione"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* POP-UP DETTAGLIO */}
            {selectedMinuta && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-2">Verbale del {new Date(selectedMinuta.data_incontro).toLocaleDateString('it-IT')}</p>
                                <h2 className="text-3xl font-black">{selectedMinuta.titolo}</h2>
                            </div>
                            <button onClick={() => {
                                setSelectedMinuta(null);
                                router.replace('/minute'); // Pulisce l'URL dall'ID
                            }} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            <div className="flex gap-4">
                                <Users className="text-blue-500 shrink-0" size={20} />
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partecipanti</h4>
                                    <p className="text-slate-700 font-semibold">{selectedMinuta.partecipanti}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <MessageSquare className="text-blue-500 shrink-0" size={20} />
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discussione</h4>
                                    <p className="text-slate-600 whitespace-pre-wrap">{selectedMinuta.argomenti}</p>
                                </div>
                            </div>
                            <div className="bg-emerald-500 p-6 rounded-[2rem] text-white flex gap-4 shadow-lg shadow-emerald-100">
                                <CheckCircle className="shrink-0" size={22} />
                                <div>
                                    <h4 className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Decisioni Finali</h4>
                                    <p className="font-black text-xl whitespace-pre-wrap">{selectedMinuta.decisioni}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50">
                            <button onClick={() => {
                                setSelectedMinuta(null);
                                router.replace('/minute');
                            }} className="w-full py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold">Chiudi</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}