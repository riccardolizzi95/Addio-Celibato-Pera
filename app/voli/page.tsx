'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plane, Car, Users, Plus, Trash2, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function VoliAlloggiPage() {
    const [activeTab, setActiveTab] = useState<'voli' | 'macchine'>('voli');
    const [loading, setLoading] = useState(true);
    const [voli, setVoli] = useState<any[]>([]);
    const [macchine, setMacchine] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Dati API Real-time (Esempio con AeroDataBox - richiede API Key su RapidAPI)
    // Se vuoi attivarlo, dovrai registrarti e inserire la chiave.
    const fetchRealTimeStatus = async (flightCode: string) => {
        // Placeholder logica API
        console.log("Controllo stato per:", flightCode);
    };

    const scaricaDati = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user);

        const { data: v } = await supabase.from('voli').select('*').order('orario_partenza', { ascending: true });
        const { data: m } = await supabase.from('macchine').select('*, macchina_passeggeri(*)');
        
        if (v) setVoli(v);
        if (m) setMacchine(m);
        setLoading(false);
    };

    useEffect(() => { scaricaDati(); }, []);

    const aggiungiMacchina = async () => {
        const conducente = prompt("Nome del conducente?");
        const posti = prompt("Posti totali in auto?", "5");
        if (!conducente) return;

        await supabase.from('macchine').insert([{
            conducente,
            posti_totali: parseInt(posti || "5"),
            creato_da: currentUser?.id
        }]);
        scaricaDati();
    };

    const aggiungitiAMacchina = async (macchinaId: string) => {
        const { data: profilo } = await supabase.from('profili').select('username').eq('id', currentUser.id).single();
        await supabase.from('macchina_passeggeri').upsert({
            macchina_id: macchinaId,
            user_id: currentUser.id,
            username: profilo?.username || 'Anonimo'
        });
        scaricaDati();
    };

    const rimuoviDaMacchina = async (passeggeroId: string) => {
        await supabase.from('macchina_passeggeri').delete().eq('id', passeggeroId);
        scaricaDati();
    };

    if (loading) return <div className="p-10 text-center font-bold">Caricamento logistica...</div>;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header & Tabs */}
            <div className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between mb-4">
                    <Link href="/" className="text-blue-600 font-bold">← Base</Link>
                    <h1 className="text-xl font-black uppercase">Voli & Logistica</h1>
                    <div className="w-10"></div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto">
                    <button 
                        onClick={() => setActiveTab('voli')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${activeTab === 'voli' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                        <Plane size={18} /> Voli
                    </button>
                    <button 
                        onClick={() => setActiveTab('macchine')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${activeTab === 'macchine' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                        <Car size={18} /> Macchine
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6">
                {activeTab === 'voli' ? (
                    <div className="space-y-6">
                        {voli.length === 0 && (
                            <div className="bg-blue-50 p-6 rounded-2xl text-center border-2 border-dashed border-blue-200">
                                <Plane className="mx-auto mb-2 text-blue-400" size={40} />
                                <p className="text-blue-700 font-bold">Nessun volo inserito nel DB.</p>
                                <p className="text-sm text-blue-500">Usa il SQL Editor per aggiungere i voli acquistati!</p>
                            </div>
                        )}
                        {voli.map(volo => (
                            <div key={volo.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase">
                                    {volo.gruppo || 'Gruppo Unico'}
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-3xl font-black tracking-tighter">{volo.partenza_aeroporto.split('(')[1].replace(')', '')}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{volo.partenza_aeroporto.split('(')[0]}</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-4">
                                        <div className="w-full h-[2px] bg-slate-100 relative">
                                            <Plane size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                                        </div>
                                        <p className="text-[10px] font-bold text-blue-600 mt-2">{volo.codice_volo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black tracking-tighter">{volo.arrivo_aeroporto.split('(')[1].replace(')', '')}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{volo.arrivo_aeroporto.split('(')[0]}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <Clock size={16} className="text-slate-400" />
                                    <p className="text-sm font-bold">Partenza: {new Date(volo.orario_partenza).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                                </div>
                                {/* Sezione Stato Real-time */}
                                <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                                        <AlertCircle size={12} /> Live Status: In Orario
                                    </span>
                                    <button className="text-[10px] font-black text-blue-600 uppercase">Dettagli Terminal →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button onClick={aggiungiMacchina} className="w-full bg-white border-2 border-dashed border-slate-300 p-4 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-blue-400 transition-all">
                            <Plus size={20} /> Aggiungi un'auto
                        </button>

                        {macchine.map(auto => (
                            <div key={auto.id} className="bg-white rounded-3xl p-6 shadow-md border border-blue-50 shadow-blue-900/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                            <Car className="text-blue-500" /> Auto di {auto.conducente}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
                                            <Users size={12} /> {auto.macchina_passeggeri?.length || 0} / {auto.posti_totali} Posti occupati
                                        </p>
                                    </div>
                                    <button onClick={async () => { if(confirm("Eliminare auto?")) { await supabase.from('macchine').delete().eq('id', auto.id); scaricaDati(); } }} className="text-slate-300 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Ritrovo</p>
                                        <p className="text-xs font-bold">{auto.orario_ritrovo || 'Da definire'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Punto</p>
                                        <p className="text-xs font-bold">{auto.punto_ritrovo || 'Da definire'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipaggio</p>
                                    <div className="flex flex-wrap gap-2">
                                        {auto.macchina_passeggeri?.map((p: any) => (
                                            <div key={p.id} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                                {p.username}
                                                {p.user_id === currentUser?.id && (
                                                    <Trash2 size={12} className="cursor-pointer text-blue-300 hover:text-red-500" onClick={() => rimuoviDaMacchina(p.id)} />
                                                )}
                                            </div>
                                        ))}
                                        {auto.macchina_passeggeri?.length < auto.posti_totali && (
                                            <button 
                                                onClick={() => aggiungitiAMacchina(auto.id)}
                                                className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Plus size={12} /> Sali a bordo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}