'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AttivitaPage() {
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [proposta, setProposta] = useState("");
    const [isLoadingAction, setIsLoadingAction] = useState(false); // Stato per i caricamenti dei bottoni
    const [listaProposte, setListaProposte] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const router = useRouter();

    // 1. Funzione di scaricamento (spostata fuori per essere accessibile a tutti)
    const scaricaDati = async () => {
        const { data } = await supabase
            .from('proposte')
            .select('*')
            .order('created_at', { ascending: false });
        setListaProposte(data || []);
    };

    // 2. Protezione della pagina
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setLoading(false);
                scaricaDati(); // Carica i dati appena confermata la sessione
            }
        };
        checkUser();
    }, [router]);

    // 3. Gestione utenti online
    useEffect(() => {
        if (loading) return;

        const channel = supabase.channel('room1', {
            config: { presence: { key: 'user' } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const usernames = Object.values(state).flat().map((u: any) => u.user_name);
                setOnlineUsers(usernames);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    await channel.track({ user_name: user?.email, online_at: new Date().toISOString() });
                }
            });

        return () => { channel.unsubscribe(); };
    }, [loading]);

    // 4. Invia nuova proposta
    const inviaPropostaAlDatabase = async () => {
        if (!proposta) return;
        setIsLoadingAction(true); // Usiamo il nome corretto

        const { error } = await supabase
            .from('proposte')
            .insert([{ titolo: proposta, creatore: 'Riccardo', voti: 0 }]);

        if (error) {
            alert("Errore salvataggio: " + error.message);
        } else {
            setProposta("");
            setIsFormOpen(false);
            scaricaDati();
        }
        setIsLoadingAction(false);
    };

    // 5. Funzione per VOTARE
    const votaProposta = async (id: number, votiAttuali: number) => {
        const { error } = await supabase
            .from('proposte')
            .update({ voti: votiAttuali + 1 })
            .eq('id', id);

        if (error) {
            console.error("Errore voto:", error);
        } else {
            scaricaDati();
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
                <h1 className="text-2xl font-bold">Proposte</h1>
            </div>

            {/* Occhio Online */}
            {onlineUsers.length >= 2 && (
                <div className="fixed bottom-6 right-6 bg-white shadow-xl border border-slate-100 px-4 py-2 rounded-full flex items-center gap-2 animate-bounce">
                    <span className="text-xl">👁️</span>
                    <span className="font-bold text-slate-700">{onlineUsers.length} online</span>
                </div>
            )}

            <div className="space-y-4">
                {listaProposte.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg">{item.titolo}</h3>
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-slate-400">Da: {item.creatore}</p>
                            <button
                                onClick={() => votaProposta(item.id, item.voti)}
                                className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold"
                            >
                                👍 {item.voti}
                            </button>
                        </div>
                    </div>
                ))}

                {isFormOpen ? (
                    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-400">
                        <h2 className="font-bold mb-4 text-lg">Nuova Proposta</h2>
                        <input
                            type="text"
                            placeholder="Esempio: Aperitivo in barca"
                            className="w-full p-3 border rounded-lg mb-4"
                            value={proposta}
                            onChange={(e) => setProposta(e.target.value)}
                            disabled={isLoadingAction}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsFormOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl">Annulla</button>
                            <button
                                onClick={inviaPropostaAlDatabase}
                                disabled={isLoadingAction}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                            >
                                {isLoadingAction ? "Invio..." : "Conferma"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500 font-medium"
                    >
                        + Aggiungi una proposta
                    </button>
                )}
            </div>
        </main>
    );
}