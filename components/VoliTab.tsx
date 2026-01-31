'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plane, Plus, Trash2, Clock, AlertCircle, X, RefreshCw, Info, Activity, MapPin, CalendarDays } from 'lucide-react';

export default function VoliTab({ isAdmin }: { isAdmin: boolean }) {
    const [voli, setVoli] = useState<any[]>([]);
    const [isVoloFormOpen, setIsVoloFormOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [selectedVolo, setSelectedVolo] = useState<any>(null);
    const [nuovoVolo, setNuovoVolo] = useState({ codice: '', data: '', gruppo: '' });

    const standardizzaData = (str: string) => str ? str.replace(/\s/, 'T') : '';

    const fetchFlightData = async (code: string, date: string) => {
        const cleanCode = code.replace(/\s+/g, '').toUpperCase();
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
            }
        };
        const res = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${cleanCode}/${date}`, options);
        if (!res.ok) return null;
        const data = await res.json();
        return data && data.length > 0 ? data[0] : null;
    };

    const scaricaVoli = async () => {
        const { data } = await supabase.from('voli').select('*').order('orario_partenza', { ascending: true });
        if (data) setVoli(data);
    };

    useEffect(() => { scaricaVoli(); }, []);

    const handleAggiungiVolo = async () => {
        if (!nuovoVolo.codice || !nuovoVolo.data) return alert("Inserisci codice e data!");
        setIsVerifying(true);
        try {
            const live = await fetchFlightData(nuovoVolo.codice, nuovoVolo.data);
            if (!live) throw new Error("Volo non trovato. Verifica il codice.");

            await supabase.from('voli').insert([{
                codice_volo: nuovoVolo.codice.toUpperCase().trim(),
                compagnia: live.airline?.name || "Sconosciuta",
                partenza_aeroporto: live.departure?.airport?.iata,
                arrivo_aeroporto: live.arrival?.airport?.iata,
                orario_partenza: standardizzaData(live.departure?.scheduledTime?.local),
                orario_arrivo: standardizzaData(live.arrival?.scheduledTime?.local),
                gruppo: nuovoVolo.gruppo || "Generale",
                last_api_response: live
            }]);

            setIsVoloFormOpen(false);
            setNuovoVolo({ codice: '', data: '', gruppo: '' });
            scaricaVoli();
        } catch (e: any) { alert(e.message); }
        setIsVerifying(false);
    };

    return (
        <div className="space-y-6">
            {isAdmin && (
                <button onClick={() => setIsVoloFormOpen(!isVoloFormOpen)} className="w-full bg-slate-900 text-white p-5 rounded-[1.8rem] font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    {isVoloFormOpen ? <X size={20}/> : <Plus size={20}/>} {isVoloFormOpen ? "Annulla" : "Aggiungi Volo Missione"}
                </button>
            )}

            {isVoloFormOpen && (
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-500 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Codice Volo</label>
                        <input type="text" placeholder="Es: HV5466" className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-blue-500 outline-none text-lg font-bold" value={nuovoVolo.codice} onChange={e => setNuovoVolo({...nuovoVolo, codice: e.target.value})} />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Data Partenza</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-blue-500 outline-none text-lg font-bold text-slate-700 min-h-[60px]" 
                                value={nuovoVolo.data} 
                                onChange={e => setNuovoVolo({...nuovoVolo, data: e.target.value})} 
                            />
                            <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Gruppo</label>
                        <input type="text" placeholder="Es: Da Verona" className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-blue-500 outline-none font-bold" value={nuovoVolo.gruppo} onChange={e => setNuovoVolo({...nuovoVolo, gruppo: e.target.value})} />
                    </div>

                    <button onClick={handleAggiungiVolo} disabled={isVerifying} className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg shadow-lg active:scale-95 transition-all flex justify-center items-center">
                        {isVerifying ? <RefreshCw className="animate-spin" /> : "VERIFICA E ATTIVA 🚀"}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {voli.map(v => {
                    const api = v.last_api_response;
                    const dSched = new Date(v.orario_partenza);
                    const aSched = new Date(v.orario_arrivo);
                    
                    // Logica Ritardi Partenza
                    const dLiveStr = standardizzaData(api?.departure?.actualTime?.local || api?.departure?.predictedTime?.local);
                    const dLive = dLiveStr ? new Date(dLiveStr) : null;
                    const hasDDelay = dLive && Math.abs(dLive.getTime() - dSched.getTime()) > 60000;

                    // Logica Ritardi Arrivo
                    const aLiveStr = standardizzaData(api?.arrival?.actualTime?.local || api?.arrival?.predictedTime?.local);
                    const aLive = aLiveStr ? new Date(aLiveStr) : null;
                    const hasADelay = aLive && Math.abs(aLive.getTime() - aSched.getTime()) > 60000;

                    return (
                        <div key={v.id} onClick={() => setSelectedVolo(v)} className="bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-all">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white px-5 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-tighter shadow-sm">{v.gruppo || 'Missione'}</div>
                            
                            <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock size={14}/> {dSched.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>

                            <div className="flex justify-between items-center mb-8 px-1">
                                {/* PARTENZA */}
                                <div className="text-center w-1/3">
                                    <p className="text-4xl font-black tracking-tighter text-slate-800 leading-none">{v.partenza_aeroporto}</p>
                                    <div className="mt-2 h-5">
                                        <p className={`text-sm font-bold ${hasDDelay ? 'line-through text-slate-300' : 'text-slate-600'}`}>
                                            {dSched.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
                                        </p>
                                        {hasDDelay && <p className="text-sm font-black text-red-600 animate-pulse">{dLive?.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}</p>}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center px-2 relative">
                                    <Plane size={24} className="text-blue-500 mb-2" />
                                    <div className="w-full h-[2px] bg-slate-100 rounded-full"></div>
                                    <p className="text-[10px] font-black text-blue-600 mt-2 tracking-widest uppercase">{v.codice_volo}</p>
                                </div>

                                {/* ARRIVO */}
                                <div className="text-center w-1/3">
                                    <p className="text-4xl font-black tracking-tighter text-slate-800 leading-none">{v.arrivo_aeroporto}</p>
                                    <div className="mt-2 h-5">
                                        <p className={`text-sm font-bold ${hasADelay ? 'line-through text-slate-300' : 'text-slate-600'}`}>
                                            {aSched.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
                                        </p>
                                        {hasADelay && <p className="text-sm font-black text-red-600 animate-pulse">{aLive?.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                                    <Activity size={12} className="animate-pulse" /> LIVE
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Term</p>
                                        <p className="text-xs font-bold text-slate-700">{api?.departure?.terminal || 'TBD'}</p>
                                    </div>
                                    <div className="text-right border-l pl-4 border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Gate</p>
                                        <p className="text-xs font-bold text-slate-700">{api?.departure?.gate || 'TBD'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* POPUP SCHEDA TECNICA (Stesso di prima, ma con Maps link corretti) */}
            {selectedVolo && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedVolo(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black italic tracking-tighter">Logistica Volo</h3>
                                <p className="text-blue-600 font-bold text-sm uppercase">{selectedVolo.codice_volo} • {selectedVolo.compagnia}</p>
                            </div>
                            <button onClick={() => setSelectedVolo(null)} className="p-3 bg-slate-100 rounded-full"><X size={24}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Aeromobile</p><p className="font-bold text-slate-700">{selectedVolo.last_api_response?.aircraft?.model || "Boeing 737-800"}</p></div>
                                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Distanza</p><p className="font-black text-blue-600">{Math.round(selectedVolo.last_api_response?.greatCircleDistance?.km || 0)} KM</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Partenza</p>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedVolo.last_api_response?.departure?.airport?.location?.lat},${selectedVolo.last_api_response?.departure?.airport?.location?.lon}`} target="_blank" className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-blue-50 text-[10px] font-black text-blue-600 shadow-sm active:scale-95"><MapPin size={14}/> MAPS</a>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Arrivo</p>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedVolo.last_api_response?.arrival?.airport?.location?.lat},${selectedVolo.last_api_response?.arrival?.airport?.location?.lon}`} target="_blank" className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-blue-50 text-[10px] font-black text-blue-600 shadow-sm active:scale-95"><MapPin size={14}/> MAPS</a>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 text-center">
                                <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">Stato Operativo</p>
                                <p className="font-black text-blue-700 uppercase text-xl">{selectedVolo.last_api_response?.status || 'Expected'}</p>
                            </div>
                        </div>

                        {isAdmin && (
                            <button onClick={async () => { if(confirm("Eliminare volo?")) { await supabase.from('voli').delete().eq('id', selectedVolo.id); setSelectedVolo(null); scaricaVoli(); } }} className="w-full mt-8 text-red-400 font-bold text-[10px] uppercase flex items-center justify-center gap-1 hover:text-red-600 transition-colors"><Trash2 size={14}/> Elimina Volo Missione</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}