'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogOut, ChevronLeft, Check, X } from 'lucide-react';

export default function ProfiloPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Validazione password (stessi requisiti di setup-account)
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isLongEnough = newPassword.length >= 8;
  const isPasswordValid = hasUpper && hasLower && hasNumber && isLongEnough;
  const showPasswordHints = newPassword.length > 0;

  useEffect(() => {
    const fetchProfile = async () => {
      // Se ci sono token nell'hash (da recovery/reset password), scambiali per una sessione
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          // Pulisci l'hash dall'URL
          window.history.replaceState(null, '', '/profilo');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.assign('/login'); return; }
      setEmail(session.user.email || '');
      const { data } = await supabase.from('profili').select('username').eq('id', session.user.id).single();
      if (data) setUsername(data.username);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const mostraFeedback = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleUpdate = async () => {
    if (!username.trim()) return mostraFeedback('Il nome non può essere vuoto.', 'error');
    if (newPassword && !isPasswordValid) return mostraFeedback('La password non rispetta i requisiti.', 'error');

    setIsUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) {
          mostraFeedback('Errore aggiornamento password: ' + pwError.message, 'error');
          setIsUpdating(false);
          return;
        }
      }
      const { error } = await supabase.from('profili').update({ username: username.trim() }).eq('id', user.id);
      if (error) mostraFeedback('Errore salvataggio profilo.', 'error');
      else { mostraFeedback('Profilo aggiornato! 🚀', 'success'); setNewPassword(''); }
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      {/* Feedback toast */}
      {feedback && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {feedback.text}
        </div>
      )}

      {/* Modal conferma logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <p className="text-4xl mb-4">👋</p>
            <h2 className="text-xl font-black mb-2">Vuoi disconnetterti?</h2>
            <p className="text-slate-400 text-sm mb-8">Dovrai reinserire le credenziali al prossimo accesso.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 active:scale-95 transition-all">Annulla</button>
              <button onClick={handleLogout} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Esci</button>
            </div>
          </div>
        </div>
      )}

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
            <input type="text" value={email} disabled className="w-full p-4 border rounded-2xl bg-slate-50 mt-1 text-slate-500 cursor-not-allowed border-slate-200" />
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
            {showPasswordHints && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Requirement label="Maiuscola" met={hasUpper} />
                <Requirement label="Minuscola" met={hasLower} />
                <Requirement label="Numero" met={hasNumber} />
                <Requirement label="Min. 8 caratt." met={isLongEnough} />
              </div>
            )}
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
              onClick={() => setShowLogoutConfirm(true)}
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

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${met ? 'text-emerald-500' : 'text-slate-300'}`}>
      {met ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
      {label}
    </div>
  );
}