'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Plus, Trash2, Clock, MapPin, X, UserPlus } from 'lucide-react';

export default function MacchineTab({ currentUser, myUsername, isAdmin }: { currentUser: any, myUsername: string, isAdmin: boolean }) {
    const [macchine, setMacchine] = useState<any[]>([]);

    const scaricaMacchine = async () => {
        const { data } = await supabase.from('macchine').select('*, macchina_passeggeri(*)').order('creato_at', { ascending: true });
        if (data) setMacchine(data);
    };

    useEffect(() => { scaricaMacchine(); }, []);

    const aggiungiMacchina = async () => {
        const conducente = prompt("Nome conducente?");
        const posti = prompt("Posti totali?", "5");
        if (conducente) {
            await supabase.from('macchine').insert([{
                conducente, posti_totali: parseInt(posti || "5"), creato_da: currentUser?.id
            }]);
            scaricaMacchine();
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={aggiungiMacchina} className="w-full bg-white border-2 border-dashed border-slate-300 p-5 rounded-[1.5rem] text-slate-500 font-bold text-xs uppercase flex items-center justify-center gap-2">
                <Plus size={20} /> Aggiungi auto per la missione
            </button>
            {macchine.map(auto => (
                <div key={auto.id} className="bg-white rounded-[2rem] p-6 shadow-md border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 italic flex items-center gap-2"><Car className="text-blue-600" /> Auto di {auto.conducente}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{auto.macchina_passeggeri?.length || 0} / {auto.posti_totali} posti occupati</p>
                        </div>
                        {(isAdmin || auto.creato_da === currentUser?.id) && (
                            <button onClick={async () => { if(confirm("Cancellare?")) { await supabase.from('macchine').delete().eq('id', auto.id); scaricaMacchine(); } }} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {auto.macchina_passeggeri?.map((p: any) => (
                            <div key={p.id} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                                {p.username}
                                {(p.user_id === currentUser?.id || isAdmin) && <X size={14} className="cursor-pointer text-blue-300" onClick={async () => { await supabase.from('macchina_passeggeri').delete().eq('id', p.id); scaricaMacchine(); }} />}
                            </div>
                        ))}
                        {auto.macchina_passeggeri?.length < auto.posti_totali && !auto.macchina_passeggeri?.some((p:any) => p.user_id === currentUser?.id) && (
                            <button onClick={async () => { 
                                await supabase.from('macchina_passeggeri').upsert({ macchina_id: auto.id, user_id: currentUser.id, username: myUsername }); 
                                scaricaMacchine(); 
                            }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"><UserPlus size={14} /> Sali a bordo</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}