'use client';
import { useState, useEffect } from 'react'; // Aggiunto useEffect
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SetupAccount() {
    const [loading, setLoading] = useState(true); // Stato per la protezione
    const [nome, setNome] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);
    const router = useRouter();

    // Protezione pagina: se non sei loggato, vai al login
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
        setIsConfiguring(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // 1. Cambia la password dell'account
            await supabase.auth.updateUser({ password: newPassword });

            // 2. Crea il profilo con il nome reale
            await supabase.from('profili').upsert({
                id: user.id,
                username: nome,
                primo_accesso: false
            });

            router.push('/attivita'); // Reindirizza alla fine
        }
        setIsConfiguring(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-blue-600 text-white font-bold">
                Caricamento...
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-blue-600 text-white">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold mb-4">Benvenuto! 🍐</h1>
                <p className="mb-8 opacity-90">Ultimi passi: scegli il tuo nome per le votazioni e una password sicura.</p>
                
                <input 
                    type="text" placeholder="Tuo Nome (es: Riccardo)" 
                    className="w-full p-4 rounded-xl mb-4 text-slate-900 outline-none"
                    onChange={e => setNome(e.target.value)}
                />
                <input 
                    type="password" placeholder="Nuova Password" 
                    className="w-full p-4 rounded-xl mb-8 text-slate-900 outline-none"
                    onChange={e => setNewPassword(e.target.value)}
                />
                
                <button 
                    onClick={handleSetup} disabled={isConfiguring}
                    className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all"
                >
                    {isConfiguring ? "Configurazione..." : "Inizia la Missione"}
                </button>
            </div>
        </main>
    );
}