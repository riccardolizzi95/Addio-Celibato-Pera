'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Plus, Trash2, X, UserPlus, ChevronUp } from 'lucide-react';

export default function MacchineTab({ currentUser, myUsername, isAdmin }: { currentUser: any, myUsername: string, isAdmin: boolean }) {
    const [macchine, setMacchine] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [conducente, setConducente] = useState('');
    const [postiTotali, setPostiTotali] = useState('5');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const scaricaMacchine = async () => {
        const { data, error } = await supabase.from('macchine').select('*, macchina_passeggeri(*)').order('creato_at', { ascending: true });
        if (!error && data) setMacchine(data);
    };

    useEffect(() => { scaricaMacchine(); }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const aggiungiMacchina = async () => {
        if (!conducente.trim()) return mostraFeedback('Inserisci il nome del conducente!', 'error');
        const posti = parseInt(postiTotali);
        if (isNaN(posti) || posti < 1 || posti > 9) return mostraFeedback('I posti devono essere tra 1 e 9.', 'error');

        setIsSaving(true);
        const { error } = await supabase.from('macchine').insert([{
            conducente: conducente.trim(),
            posti_totali: posti,
            creato_da: currentUser?.id
        }]);

        if (error) {
            mostraFeedback('Errore durante il salvataggio. Riprova.', 'error');
        } else {
            mostraFeedback(`Auto di ${conducente.trim()} aggiunta! 🚗`, 'success');
            setConducente('');
            setPostiTotali('5');
            setIsFormOpen(false);
            scaricaMacchine();
        }
        setIsSaving(false);
    };

    const eliminaMacchina = async (id: string) => {
        const { error } = await supabase.from('macchine').delete().eq('id', id);
        if (error) mostraFeedback("Errore durante l'eliminazione.", 'error');
        else { mostraFeedback('Auto rimossa.', 'success'); scaricaMacchine(); }
    };

    const saliABordo = async (macchinaId: string) => {
        const { error } = await supabase.from('macchina_passeggeri').upsert(
            { macchina_id: macchinaId, user_id: currentUser.id, username: myUsername },
            { onConflict: 'macchina_id,user_id' }
        );
        if (error) mostraFeedback('Errore. Riprova.', 'error');
        else { mostraFeedback('Sei salito a bordo! 🎉', 'success'); scaricaMacchine(); }
    };

    const scendi = async (passeggeroId: string) => {
        const { error } = await supabase.from('macchina_passeggeri').delete().eq('id', passeggeroId);
        if (error) mostraFeedback('Errore. Riprova.', 'error');
        else { mostraFeedback("Sceso dall'auto.", 'success'); scaricaMacchine(); }
    };

    return (
        <div className="space-y-6">
            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* Pulsante / Form aggiungi auto */}
            <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full bg-white border-2 border-dashed border-slate-300 p-5 rounded-[1.5rem] text-slate-500 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-all"
            >
                {isFormOpen ? <ChevronUp size={20} /> : <Plus size={20} />}
                {isFormOpen ? 'Annulla' : 'Aggiungi auto per la missione'}
            </button>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-400 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome Conducente</label>
                        <input
                            type="text"
                            placeholder="Es: Marco"
                            className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                            value={conducente}
                            onChange={e => setConducente(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && aggiungiMacchina()}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Posti Totali</label>
                        <input
                            type="number"
                            min="1"
                            max="9"
                            placeholder="5"
                            className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                            value={postiTotali}
                            onChange={e => setPostiTotali(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={aggiungiMacchina}
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-300"
                    >
                        {isSaving ? 'Salvataggio...' : '🚗 Aggiungi Auto'}
                    </button>
                </div>
            )}

            {/* Stato vuoto */}
            {macchine.length === 0 && !isFormOpen && (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-4xl mb-3">🚗</p>
                    <p className="text-slate-400 font-bold">Nessuna auto ancora aggiunta.</p>
                </div>
            )}

            {/* Lista macchine */}
            {macchine.map(auto => {
                const postiOccupati = auto.macchina_passeggeri?.length || 0;
                const postiFull = postiOccupati >= auto.posti_totali;
                const sonoABordo = auto.macchina_passeggeri?.some((p: any) => p.user_id === currentUser?.id);
                const mioPasseggeroId = auto.macchina_passeggeri?.find((p: any) => p.user_id === currentUser?.id)?.id;

                return (
                    <div key={auto.id} className="bg-white rounded-[2rem] p-6 shadow-md border border-slate-100">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 italic flex items-center gap-2">
                                    <Car className="text-blue-600" /> Auto di {auto.conducente}
                                </h3>
                                <p className={`text-[10px] font-bold uppercase mt-1 ${postiFull ? 'text-red-500' : 'text-slate-400'}`}>
                                    {postiOccupati} / {auto.posti_totali} posti occupati {postiFull && '— PIENA'}
                                </p>
                            </div>
                            {(isAdmin || auto.creato_da === currentUser?.id) && (
                                <button
                                    onClick={() => eliminaMacchina(auto.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    title="Elimina auto"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Barra posti visiva */}
                        <div className="flex gap-1 mb-5">
                            {Array.from({ length: auto.posti_totali }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 flex-1 rounded-full transition-all ${i < postiOccupati ? 'bg-blue-500' : 'bg-slate-100'}`}
                                />
                            ))}
                        </div>

                        {/* Passeggeri */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {auto.macchina_passeggeri?.map((p: any) => (
                                <div key={p.id} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-blue-100">
                                    {p.username}
                                    {(p.user_id === currentUser?.id || isAdmin) && (
                                        <X
                                            size={14}
                                            className="cursor-pointer text-blue-300 hover:text-red-500 transition-colors"
                                            onClick={() => scendi(p.id)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {!postiFull && !sonoABordo && (
                            <button
                                onClick={() => saliABordo(auto.id)}
                                className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <UserPlus size={16} /> Sali a bordo
                            </button>
                        )}
                        {sonoABordo && (
                            <button
                                onClick={() => scendi(mioPasseggeroId)}
                                className="w-full bg-slate-100 text-slate-500 px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                            >
                                <X size={16} /> Scendi dall'auto
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}