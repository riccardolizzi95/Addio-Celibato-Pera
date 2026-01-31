'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plane, Car, RefreshCw } from 'lucide-react';
import VoliTab from '@/components/VoliTab';
import MacchineTab from '@/components/MacchineTab';

export default function VoliLogisticaPage() {
    const [activeTab, setActiveTab] = useState<'voli' | 'macchine'>('voli');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [myUsername, setMyUsername] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setCurrentUser(session.user);
                const { data: prof } = await supabase.from('profili').select('username, admin').eq('id', session.user.id).single();
                if (prof) { setMyUsername(prof.username); setIsAdmin(prof.admin || false); }
            }
            setLoading(false);
        };
        init();
    }, []);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold italic">Caricamento logistica...</div>;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            <div className="bg-white border-b sticky top-0 z-20 p-4 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between mb-4">
                    <Link href="/" className="text-blue-600 font-bold">← Home</Link>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter">Logistica</h1>
                    <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-blue-600"><RefreshCw size={20} /></button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl max-w-xs mx-auto">
                    <button onClick={() => setActiveTab('voli')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'voli' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}><Plane size={18} /> Voli</button>
                    <button onClick={() => setActiveTab('macchine')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'macchine' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}><Car size={18} /> Macchine</button>
                </div>
            </div>
            <div className="max-w-2xl mx-auto p-6">
                {activeTab === 'voli' ? <VoliTab isAdmin={isAdmin} /> : <MacchineTab isAdmin={isAdmin} currentUser={currentUser} myUsername={myUsername} />}
            </div>
        </main>
    );
}