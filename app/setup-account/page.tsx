'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SetupAccount() {
    const [loading, setLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, [router]);

    const handleSetup = async () => {
        if (!nome || !newPassword) return alert("Inserisci nome e password!");
        setIsConfiguring(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await supabase.auth.updateUser({ password: newPassword });
            await supabase.from('profili').upsert({
                id: user.id,
                username: nome,
                primo_accesso: false
            });
            router.push('/'); 
        }
        setIsConfiguring(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center">
                <span className="text-5xl mb-4 block">🍐</span>
                <h1 className="text-3xl font-bold mb-2 tracking-tight">Benvenuto a bordo!</h1>
                <p className="text-slate-500 mb-8">Personalizza il tuo profilo per iniziare la missione.</p>
                
                <div className="space-y-4 text-left">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1">Come ti chiamano gli amici?</label>
                        <input 
                            type="text" 
                            placeholder="Es: Riccardo" 
                            className="w-full p-4 border rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all bg-slate-50"
                            onChange={e => setNome(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 ml-1">Scegli una password sicura</label>
                        <input 
                            type="password" 
                            placeholder="Nuova Password" 
                            className="w-full p-4 border rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all bg-slate-50"
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleSetup} 
                    disabled={isConfiguring}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all mt-8 disabled:bg-slate-300"
                >
                    {isConfiguring ? "Configurazione in corso..." : "Inizia la Missione"}
                </button>
            </div>
        </main>
    );
}