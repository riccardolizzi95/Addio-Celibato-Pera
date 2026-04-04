'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Plus, Trash2, X, UserPlus, ChevronUp, MapPin, Clock, Pencil } from 'lucide-react';

export default function MacchineTab({ currentUser, myUsername, isAdmin, gruppo = 'celibato' }: { currentUser: any, myUsername: string, isAdmin: boolean, gruppo?: string }) {
    const [macchine, setMacchine] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // null = nuova auto, stringa = modifica
    const [conducente, setConducente] = useState('');
    const [postiTotali, setPostiTotali] = useState('5');
    const [puntoRitrovo, setPuntoRitrovo] = useState('');
    const [orarioRitrovo, setOrarioRitrovo] = useState('');
    const [dataRitrovo, setDataRitrovo] = useState('2026-04-18');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const scaricaMacchine = async () => {
        const { data, error } = await supabase.from('macchine').select('*, macchina_passeggeri(*)').eq('gruppo', gruppo).order('creato_at', { ascending: true });
        if (!error && data) setMacchine(data);
    };

    useEffect(() => { scaricaMacchine(); }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const apriFormModifica = (auto: any) => {
        setEditingId(auto.id);
        setConducente(auto.conducente || '');
        setPostiTotali(String(auto.posti_totali || 5));
        setPuntoRitrovo(auto.punto_ritrovo || '');
        setOrarioRitrovo(auto.orario_ritrovo || '');
        setDataRitrovo(auto.data_ritrovo || '2026-04-18');
        setIsFormOpen(true);
        // Scrolla su al form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setConducente('');
        setPostiTotali('5');
        setPuntoRitrovo('');
        setOrarioRitrovo('');
        setDataRitrovo('2026-04-18');
    };

    const salvaMacchina = async () => {
        if (!conducente.trim()) return mostraFeedback('Inserisci il nome del conducente!', 'error');
        const posti = parseInt(postiTotali);
        if (isNaN(posti) || posti < 1 || posti > 9) return mostraFeedback('I posti devono essere tra 1 e 9.', 'error');

        setIsSaving(true);
        const payload = {
            conducente: conducente.trim(),
            posti_totali: posti,
            punto_ritrovo: puntoRitrovo.trim() || null,
            orario_ritrovo: orarioRitrovo.trim() || null,
            data_ritrovo: dataRitrovo || null,
        };

        let error;
        if (editingId) {
            // Modifica record esistente
            ({ error } = await supabase.from('macchine').update(payload).eq('id', editingId));
        } else {
            // Nuovo record: inserisco l'auto e aggiungo subito il conducente come passeggero
            const { data: nuovaAuto, error: insertError } = await supabase
                .from('macchine')
                .insert([{ ...payload, creato_da: currentUser?.id, gruppo }])
                .select('id')
                .single();
            error = insertError;

            if (!error && nuovaAuto) {
                // Aggiunge automaticamente il conducente come primo passeggero
                await supabase.from('macchina_passeggeri').insert([{
                    macchina_id: nuovaAuto.id,
                    user_id: currentUser.id,
                    username: myUsername,
                }]);
            }
        }

        if (error) {
            mostraFeedback('Errore durante il salvataggio. Riprova.', 'error');
        } else {
            mostraFeedback(editingId ? 'Auto aggiornata! ✅' : `Auto di ${conducente.trim()} aggiunta! 🚗`, 'success');
            resetForm();
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

    const hoGiaUnAuto = macchine.some(a => a.creato_da === currentUser?.id);

    return (
        <div className="space-y-6">
            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* Pulsante aggiungi — nascosto se hai già un'auto */}
            {!hoGiaUnAuto && (
                <button
                    onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
                    className="w-full bg-white border-2 border-dashed border-slate-300 p-5 rounded-[1.5rem] text-slate-500 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-all"
                >
                    {isFormOpen ? <ChevronUp size={20} /> : <Plus size={20} />}
                    {isFormOpen ? 'Annulla' : 'Aggiungi auto per la missione'}
                </button>
            )}

            {/* Banner se hai già un'auto */}
            {hoGiaUnAuto && !isFormOpen && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-amber-700 text-xs font-bold flex items-center gap-3">
                    <span className="text-xl">🚗</span>
                    Hai già aggiunto la tua auto. Usa la matita per modificarla.
                </div>
            )}

            {/* Form aggiungi / modifica */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-400 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
                        {editingId ? '✏️ Modifica Auto' : '🚗 Nuova Auto'}
                    </p>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome Conducente</label>
                        <input
                            type="text"
                            placeholder="Es: Marco"
                            className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                            value={conducente}
                            onChange={e => setConducente(e.target.value)}
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data Ritrovo</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-slate-700"
                                value={dataRitrovo}
                                onChange={e => setDataRitrovo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Orario Ritrovo</label>
                            <input
                                type="time"
                                className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-slate-700"
                                value={orarioRitrovo}
                                onChange={e => setOrarioRitrovo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Punto di Ritrovo</label>
                        <input
                            type="text"
                            placeholder="Es: Parcheggio Esselunga Via Roma"
                            className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                            value={puntoRitrovo}
                            onChange={e => setPuntoRitrovo(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 ml-1 mt-1">Inserisci l'indirizzo esatto per aprirlo in Maps 📍</p>
                    </div>
                    <button
                        onClick={salvaMacchina}
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-300"
                    >
                        {isSaving ? 'Salvataggio...' : editingId ? '✅ Salva Modifiche' : '🚗 Aggiungi Auto'}
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
                const possoGestire = isAdmin || auto.creato_da === currentUser?.id;

                return (
                    <div key={auto.id} className="bg-white rounded-[2rem] p-6 shadow-md border border-slate-100">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 italic flex items-center gap-2">
                                    <Car className="text-blue-600" /> Auto di {auto.conducente}
                                </h3>
                                <p className={`text-[10px] font-bold uppercase mt-1 ${postiFull ? 'text-red-500' : 'text-slate-400'}`}>
                                    {postiOccupati} / {auto.posti_totali} posti occupati {postiFull && '— PIENA'}
                                </p>
                            </div>
                            {possoGestire && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => apriFormModifica(auto)}
                                        className="text-slate-300 hover:text-blue-500 transition-colors p-2"
                                        title="Modifica auto"
                                    >
                                        <Pencil size={17} />
                                    </button>
                                    <button
                                        onClick={() => eliminaMacchina(auto.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                        title="Elimina auto"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Orario e Punto di Ritrovo */}
                        {(auto.data_ritrovo || auto.orario_ritrovo || auto.punto_ritrovo) && (
                            <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-3 border border-slate-100">
                                {(auto.data_ritrovo || auto.orario_ritrovo) && (
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-blue-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ritrovo</p>
                                            <p className="font-black text-slate-800">
                                                {auto.data_ritrovo && new Date(auto.data_ritrovo + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                {auto.data_ritrovo && auto.orario_ritrovo && ' · '}
                                                {auto.orario_ritrovo && auto.orario_ritrovo}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {auto.punto_ritrovo && (
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-blue-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punto di ritrovo</p>
                                            <p className="font-bold text-slate-700 text-sm truncate">{auto.punto_ritrovo}</p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(auto.punto_ritrovo)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 bg-blue-600 text-white text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-sm shadow-blue-200"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <MapPin size={12} /> MAPS
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

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
                            {auto.macchina_passeggeri?.map((p: any) => {
                                const eConducente = p.user_id === auto.creato_da;
                                const puoRimuovere = !eConducente && (p.user_id === currentUser?.id || isAdmin);
                                return (
                                    <div key={p.id} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border ${eConducente ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {eConducente && '🚗 '}{p.username}
                                        {puoRimuovere && (
                                            <X
                                                size={14}
                                                className="cursor-pointer text-blue-300 hover:text-red-500 transition-colors"
                                                onClick={() => scendi(p.id)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {!postiFull && !sonoABordo && (
                            <button
                                onClick={() => saliABordo(auto.id)}
                                className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <UserPlus size={16} /> Sali a bordo
                            </button>
                        )}
                        {sonoABordo && auto.creato_da !== currentUser?.id && (
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