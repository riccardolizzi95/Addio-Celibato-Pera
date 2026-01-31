'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ChevronLeft } from 'lucide-react';

export default function ProfiloPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }

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
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
      }
      const { error } = await supabase.from('profili').update({ username }).eq('id', user.id);
      if (!error) alert("Profilo aggiornato! 🚀");
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    if (confirm("Vuoi davvero disconnetterti?")) {
      await supabase.auth.signOut();
      window.location.assign('/login');
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-8">
           <Link href="/" className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
              <ChevronLeft size={24} />
           </Link>
           <h1 className="text-2xl font-black italic tracking-tight">Gestione Account</h1>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Account</label>
            <input 
              type="text" 
              value={email} 
              disabled 
              className="w-full p-4 border rounded-2xl bg-slate-50 mt-1 text-slate-500 cursor-not-allowed border-slate-200"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Visualizzato</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Come ti chiamano?"
              className="w-full p-4 border rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuova Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Lascia vuoto per non cambiare"
              className="w-full p-4 border rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all bg-white"
            />
          </div>

          <button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-300"
          >
            {isUpdating ? "Salvataggio..." : "Salva Modifiche"}
          </button>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              Disconnetti Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}