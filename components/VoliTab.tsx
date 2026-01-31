'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plane, Plus, Trash2, Clock, AlertCircle, X, RefreshCw, Info, Activity, MapPin, Navigation } from 'lucide-react';

export default function VoliTab({ isAdmin }: { isAdmin: boolean }) {
    const [voli, setVoli] = useState<any[]>([]);
    const [isVoloFormOpen, setIsVoloFormOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [selectedVolo, setSelectedVolo] = useState<any>(null);
    const [nuovoVolo, setNuovoVolo] = useState({ codice: '', data: '', gruppo: '' });

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
        const data = await res.json();
        return data && data.length > 0 ? data[0] : null;
    };

    const scaricaVoli = async () => {
        const { data } = await supabase.from('voli').select('*').order('orario_partenza', { ascending: true });
        if (data) setVoli(data);
    };

    const handleAggiungiVolo = async () => {
        setIsVerifying(true);
        try {
            const live = await fetchFlightData(nuovoVolo.codice, nuovoVolo.data);
            if (!live) throw new Error("Volo non trovato. Verifica codice e data.");

            await supabase.from('voli').insert([{
                codice_volo: nuovoVolo.codice.toUpperCase(),
                compagnia: live.airline?.name,
                partenza_aeroporto: live.departure?.airport?.iata,
                arrivo_aeroporto: live.arrival?.airport?.iata,
                orario_partenza: live.departure?.scheduledTime?.local,
                orario_arrivo: live.arrival?.scheduledTime?.local,
                gruppo: nuovoVolo.gruppo,
                last_api_response: live
            }]);

            setIsVoloFormOpen(false);
            setNuovoVolo({ codice: '', data: '', gruppo: '' });
            scaricaVoli();
        } catch (e: any) { alert(e.message); }
        setIsVerifying(false);
    };

    useEffect(() => { scaricaVoli(); }, []);

    return (
        <div className="space-y-6">
            {isAdmin && (
                <button onClick={() => setIsVoloFormOpen(!isVoloFormOpen)} className="w-full bg-slate-800 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
                    {isVoloFormOpen ? <X size={20}/> : <Plus size={20}/>} {isVoloFormOpen ? "Annulla" : "Aggiungi Volo Missione"}
                </button>
            )}

            {isVoloFormOpen && (
                <div className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-xl space-y-4">
                    <input type="text" placeholder="Codice Volo (es: HV5466)" className="w-full p-4 bg-slate-50 rounded-xl border outline-none" value={nuovoVolo.codice} onChange={e => setNuovoVolo({...nuovoVolo, codice: e.target.value})} />
                    <input type="date" className="w-full p-4 bg-slate-50 rounded-xl border outline-none" value={nuovoVolo.data} onChange={e => setNuovoVolo({...nuovoVolo, data: e.target.value})} />
                    <input type="text" placeholder="Gruppo (es: Da Udine)" className="w-full p-4 bg-slate-50 rounded-xl border outline-none" value={nuovoVolo.gruppo} onChange={e => setNuovoVolo({...nuovoVolo, gruppo: e.target.value})} />
                    <button onClick={handleAggiungiVolo} disabled={isVerifying} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">
                        {isVerifying ? "Verifica..." : "Verifica e Attiva Monitoraggio 🚀"}
                    </button>
                </div>
            )}

            {voli.map(v => {
                const api = v.last_api_response;
                const dSched = v.orario_partenza ? new Date(v.orario_partenza) : null;
                const aSched = v.orario_arrivo ? new Date(v.orario_arrivo) : null;
                
                const dLive = api?.departure?.actualTime?.local || api?.departure?.predictedTime?.local;
                const aLive = api?.arrival?.actualTime?.local || api?.arrival?.predictedTime?.local;

                const hasDDelay = dLive && dSched && Math.abs(new Date(dLive).getTime() - dSched.getTime()) > 60000;
                const hasADelay = aLive && aSched && Math.abs(new Date(aLive).getTime() - aSched.getTime()) > 60000;

                return (
                    <div key={v.id} onClick={() => setSelectedVolo(v)} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 relative overflow-hidden cursor-pointer active:scale-95 transition-all">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase">{v.gruppo}</div>
                        
                        {/* Data del Volo */}
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 px-1">
                            {dSched?.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>

                        <div className="flex justify-between items-center mb-8">
                            <div className="text-center">
                                <p className="text-4xl font-black tracking-tighter text-slate-800">{v.partenza_aeroporto}</p>
                                <p className={`text-sm font-bold ${hasDDelay ? 'line-through text-slate-300' : 'text-slate-600'}`}>
                                    {dSched?.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
                                </p>
                                {hasDDelay && <p className="text-sm font-black text-red-600">{new Date(dLive).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}</p>}
                            </div>

                            <div className="flex-1 flex flex-col items-center px-4">
                                <Plane size={20} className="text-blue-500 mb-1" />
                                <div className="w-full h-[1px] bg-slate-100 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[9px] font-black text-blue-600 tracking-widest">{v.codice_volo}</div>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-4xl font-black tracking-tighter text-slate-800">{v.arrivo_aeroporto}</p>
                                <p className={`text-sm font-bold ${hasADelay ? 'line-through text-slate-300' : 'text-slate-600'}`}>
                                    {aSched?.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
                                </p>
                                {hasADelay && <p className="text-sm font-black text-red-600">{new Date(aLive).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                                <Activity size={12} className="animate-pulse" /> LIVE MONITORING
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 italic underline decoration-blue-200">Scheda Tecnica <Info size={12}/></span>
                        </div>
                    </div>
                );
            })}

            {/* POPUP SCHEDA TECNICA PRO */}
            {selectedVolo && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setSelectedVolo(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tight">Logistica Volo</h3>
                                <p className="text-blue-600 font-bold text-xs uppercase">{selectedVolo.codice_volo} • {selectedVolo.compagnia}</p>
                            </div>
                            <button onClick={() => setSelectedVolo(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Aeromobile</p><p className="font-bold text-slate-700 text-sm">{selectedVolo.last_api_response?.aircraft?.model || "Boeing 737-800"}</p></div>
                                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Distanza</p><p className="font-bold text-blue-600 text-sm">{Math.round(selectedVolo.last_api_response?.greatCircleDistance?.km || 0)} KM</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Partenza</p>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedVolo.last_api_response?.departure?.airport?.location?.lat},${selectedVolo.last_api_response?.departure?.airport?.location?.lon}`} target="_blank" className="flex items-center justify-center gap-1 bg-white p-2 rounded-xl border text-[10px] font-black text-blue-600 shadow-sm">
                                        <MapPin size={12}/> APRI MAPS
                                    </a>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Arrivo</p>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedVolo.last_api_response?.arrival?.airport?.location?.lat},${selectedVolo.last_api_response?.arrival?.airport?.location?.lon}`} target="_blank" className="flex items-center justify-center gap-1 bg-white p-2 rounded-xl border text-[10px] font-black text-blue-600 shadow-sm">
                                        <MapPin size={12}/> APRI MAPS
                                    </a>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Status Operativo</p>
                                <p className="font-black text-blue-700 uppercase">{selectedVolo.last_api_response?.status || 'Expected'}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedVolo(null)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                            <Navigation size={18}/> Chiudi Scheda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}