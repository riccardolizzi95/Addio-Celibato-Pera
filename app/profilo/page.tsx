'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfiloPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(''); // Nuovo stato per l'email
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // Recuperiamo l'email direttamente dalla sessione auth
      setEmail(session.user.email || '');

      const { data } = await supabase
        .from('profili')
        .select('username')
        .eq('id', session.user.id)
        .single();
      
      if (data) setUsername(data.username);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
      }
      await supabase.from('profili').update({ username }).eq('id', user.id);
      alert("Profilo aggiornato! 🚀");
    }
    setIsUpdating(false);
  };

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
           <Link href="/" className="text-blue-600 font-bold">←</Link>
           <h1 className="text-2xl font-bold italic">Il Tuo Profilo</h1>
        </div>

        <div className="space-y-6">
          {/* Campo Email (Solo Visualizzazione) */}
          <div>
            <label className="text-sm font-semibold text-slate-500 ml-1">Email (Account)</label>
            <input 
              type="text" 
              value={email} 
              disabled 
              className="w-full p-4 border rounded-2xl bg-slate-100 mt-1 text-slate-500 cursor-not-allowed border-slate-200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-500 ml-1">Nome Visualizzato</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 border rounded-2xl bg-slate-50 mt-1 outline-none focus:ring-2 ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-500 ml-1">Nuova Password (lascia vuoto se non vuoi cambiarla)</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 border rounded-2xl bg-slate-50 mt-1 outline-none focus:ring-2 ring-blue-500 transition-all"
            />
          </div>

          <button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-300"
          >
            {isUpdating ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </div>
      </div>
    </main>
  );
}