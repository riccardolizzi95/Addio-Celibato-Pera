'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AttivitaPage() {
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [proposta, setProposta] = useState("");
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [listaProposte, setListaProposte] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [myUsername, setMyUsername] = useState("");
    const router = useRouter();

    // 1. Scarica proposte includendo i voti e i nomi di chi ha votato
    const scaricaDati = async () => {
        const { data, error } = await supabase
            .from('proposte')
            .select(`
                *,
                voti_proposte (
                    valore,
                    user_id,
                    profili ( username )
                )
            `)
            .order('created_at', { ascending: false });
        
        if (!error) setListaProposte(data || []);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUserId(session.user.id);
                const { data: prof } = await supabase.from('profili').select('username').eq('id', session.user.id).single();
                if (prof) setMyUsername(prof.username);
                
                setLoading(false);
                scaricaDati();
            }
        };
        checkUser();
    }, [router]);

    // 2. Logica di Voto Avanzata (Like/Unlike/Downvote)
    const gestisciVoto = async (propostaId: number, valoreRichiesto: number) => {
        if (!userId) return;

        // Controlliamo se l'utente ha già un voto su questa proposta
        const votoEsistente = listaProposte
            .find(p => p.id === propostaId)
            ?.voti_proposte?.find((v: any) => v.user_id === userId);

        if (votoEsistente && votoEsistente.valore === valoreRichiesto) {
            // Se clicco lo STESSO tasto -> RIMUOVO il voto (Unlike)
            await supabase
                .from('voti_proposte')
                .delete()
                .eq('proposta_id', propostaId)
                .eq('user_id', userId);
        } else {
            // Altrimenti -> AGGIORNO o INSERISCO (Upsert)
            await supabase
                .from('voti_proposte')
                .upsert({
                    proposta_id: propostaId,
                    user_id: userId,
                    valore: valoreRichiesto
                }, { onConflict: 'proposta_id,user_id' });
        }
        
        scaricaDati(); // Rinfresca tutto
    };

    const inviaPropostaAlDatabase = async () => {
        if (!proposta) return;
        setIsLoadingAction(true);
        const { error } = await supabase
            .from('proposte')
            .insert([{ titolo: proposta, creatore: myUsername || 'Anonimo' }]);

        if (!error) {
            setProposta("");
            setIsFormOpen(false);
            scaricaDati();
        }
        setIsLoadingAction(false);
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900 pb-20">
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
                <h1 className="text-2xl font-bold">Proposte</h1>
            </div>

            <div className="space-y-6">
                {listaProposte.map((item) => {
                    // Calcoliamo chi ha votato cosa
                    const votiSu = item.voti_proposte?.filter((v: any) => v.valore === 1) || [];
                    const votiGiu = item.voti_proposte?.filter((v: any) => v.valore === -1) || [];
                    const mioVoto = item.voti_proposte?.find((v: any) => v.user_id === userId)?.valore;

                    return (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-xl text-slate-800">{item.titolo}</h3>
                            <p className="text-xs text-slate-400 mt-1">Proposto da: <span className="font-medium text-slate-600">{item.creatore}</span></p>
                            
                            <div className="flex flex-col gap-4 mt-6">
                                {/* Sezione POLLICE SU */}
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => gestisciVoto(item.id, 1)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${mioVoto === 1 ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        👍 {votiSu.length}
                                    </button>
                                    {votiSu.length > 0 && (
                                        <p className="text-[10px] text-slate-400 pl-1 italic">
                                            Sì: {votiSu.map((v: any) => v.profili?.username).join(", ")}
                                        </p>
                                    )}
                                </div>

                                {/* Sezione POLLICE GIÙ */}
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => gestisciVoto(item.id, -1)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${mioVoto === -1 ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        👎 {votiGiu.length}
                                    </button>
                                    {votiGiu.length > 0 && (
                                        <p className="text-[10px] text-slate-400 pl-1 italic">
                                            No: {votiGiu.map((v: any) => v.profili?.username).join(", ")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Pulsante Aggiungi (come prima) */}
                {isFormOpen ? (
                    <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-400">
                        <input type="text" placeholder="Cosa proponi?" className="w-full p-4 border rounded-xl mb-4 bg-slate-50" value={proposta} onChange={(e) => setProposta(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => setIsFormOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annulla</button>
                            <button onClick={inviaPropostaAlDatabase} disabled={isLoadingAction} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">
                                {isLoadingAction ? "Invio..." : "Conferma"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsFormOpen(true)} className="w-full border-2 border-dashed border-slate-300 rounded-2xl py-8 text-slate-500 font-bold hover:bg-slate-100 transition-colors">
                        + Nuova Proposta
                    </button>
                )}
            </div>
        </main>
    );
}