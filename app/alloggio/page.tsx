'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Calendar, Info, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function AlloggioPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [alloggi, setAlloggi] = useState<any[]>([]);

    const scaricaDati = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: prof } = await supabase.from('profili').select('admin').eq('id', session.user.id).single();
            if (prof?.admin) setIsAdmin(true);
        }
        const { data } = await supabase.from('alloggi').select('*').order('check_in', { ascending: true });
        if (data) setAlloggi(data);
        setLoading(false);
    };

    useEffect(() => { scaricaDati(); }, []);

    if (loading) return <div className="p-10 text-center font-bold">Caricamento alloggi...</div>;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-blue-600 font-bold">← Home</Link>
                    <h1 className="text-2xl font-black italic">Alloggio</h1>
                </div>

                {alloggi.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
                        <p className="text-slate-400 font-bold text-lg">Nessun alloggio ancora inserito.</p>
                        {isAdmin && <p className="text-sm text-blue-500">Comandante, usa il DB per aggiungere la base!</p>}
                    </div>
                )}

                {alloggi.map(alloggio => (
                    <div key={alloggio.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-6 mb-6">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-800">{alloggio.nome}</h2>
                            <div className="flex items-center gap-2 text-blue-600 mt-2">
                                <MapPin size={18} />
                                <p className="font-bold text-sm">{alloggio.indirizzo}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Check-in</p>
                                <p className="font-bold text-sm">{new Date(alloggio.check_in).toLocaleDateString('it-IT')}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Check-out</p>
                                <p className="font-bold text-sm">{new Date(alloggio.check_out).toLocaleDateString('it-IT')}</p>
                            </div>
                        </div>

                        {alloggio.link_mappa && (
                            <a href={alloggio.link_mappa} target="_blank" className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200">
                                <ExternalLink size={20} /> Apri in Google Maps
                            </a>
                        )}

                        {alloggio.note && (
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-2 text-amber-700">
                                    <Info size={18} />
                                    <p className="font-black text-xs uppercase">Note Importanti</p>
                                </div>
                                <p className="text-amber-900 text-sm leading-relaxed">{alloggio.note}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}