'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ShieldCheck } from 'lucide-react';

export default function SetupAccount() {
    const [loading, setLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Validazione Password
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;
    const isPasswordValid = hasUpper && hasLower && hasNumber && isLongEnough;

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) window.location.assign('/login');
            else setLoading(false);
        };
        checkUser();
    }, []);

    const handleSetup = async () => {
        if (!nome || !isPasswordValid) return alert("Assicurati che la password rispetti i requisiti!");
        setIsConfiguring(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.auth.updateUser({ password: newPassword });
            await supabase.from('profili').upsert({ id: user.id, username: nome, primo_accesso: false });
            window.location.assign('/'); 
        }
        setIsConfiguring(false);
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 italic text-blue-500">Inizializzazione profilo...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
                <div className="mb-6">
                    <span className="text-6xl mb-2 block">🍐</span>
                    <h1 className="text-3xl font-black italic tracking-tighter">Benvenuto, Re!</h1>
                    <p className="text-slate-400 font-medium">Configura il tuo accesso alla Missione.</p>
                </div>

                <div className="space-y-6 text-left">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Il tuo nome (o nickname)</label>
                        <input type="text" placeholder="Es: Pera Master" className="w-full p-4 bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" onChange={e => setNome(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nuova Password</label>
                        <input type="password" placeholder="Scegli una password forte" className="w-full p-4 bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" onChange={e => setNewPassword(e.target.value)} />
                        
                        {/* Requisiti visivi */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Requirement label="Maiuscola" met={hasUpper} />
                            <Requirement label="Minuscola" met={hasLower} />
                            <Requirement label="Numero" met={hasNumber} />
                            <Requirement label="Min. 8 caratt." met={isLongEnough} />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSetup} 
                    disabled={isConfiguring || !isPasswordValid || !nome} 
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg shadow-lg active:scale-95 transition-all mt-8 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={20} />
                    {isConfiguring ? "Salvataggio..." : "Attiva Account e Inizia 🚀"}
                </button>
            </div>
        </main>
    );
}

function Requirement({ label, met }: { label: string, met: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${met ? 'text-emerald-500' : 'text-slate-300'}`}>
            {met ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
            {label}
        </div>
    );
}