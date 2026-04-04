'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Trash2, X, TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowLeft, Pencil } from 'lucide-react';

type Contributo = { id: string; user_id: string; username: string; importo: number; data: string; note: string | null };
type Spesa = { id: string; descrizione: string; importo: number; categoria: string; data: string; pagata: boolean; note: string | null; esclusi: string[]; include_festeggiato: boolean; num_persone: number };

const TUTTI_PARTECIPANTI = 8;

export default function SpesePage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'contributi' | 'spese' | 'analisi'>('dashboard');
  const [contributi, setContributi] = useState<Contributo[]>([]);
  const [spese, setSpese] = useState<Spesa[]>([]);
  const [profili, setProfili] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showRimborsoPopup, setShowRimborsoPopup] = useState(false);

  // Form contributo
  const [showFormContributo, setShowFormContributo] = useState(false);
  const [editingContributoId, setEditingContributoId] = useState<string | null>(null);
  const [cUserId, setCUserId] = useState('');
  const [cImporto, setCImporto] = useState('');
  const [cData, setCData] = useState(new Date().toISOString().split('T')[0]);
  const [cNote, setCNote] = useState('');

  // Form spesa
  const [showFormSpesa, setShowFormSpesa] = useState(false);
  const [editingSpesaId, setEditingSpesaId] = useState<string | null>(null);
  const [sDescrizione, setSDescrizione] = useState('');
  const [sImporto, setSImporto] = useState('');
  const [sData, setSData] = useState(new Date().toISOString().split('T')[0]);
  const [sCategoria, setSCategoria] = useState<'alloggio' | 'voli_trasporti' | 'svago'>('svago');
  const [sPagata, setSPagata] = useState(true);
  const [sNote, setSNote] = useState('');
  const [sEsclusi, setSEsclusi] = useState<string[]>([]);
  const [sIncludeFesteggiato, setSIncludeFesteggiato] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const mostraFeedback = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const caricaDati = async () => {
    const [{ data: c }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('contributi').select('*').eq('gruppo', 'nubilato').order('data', { ascending: false }),
      supabase.from('spese').select('*').eq('gruppo', 'nubilato').order('data', { ascending: false }),
      supabase.from('profili').select('id, username').eq('gruppo', 'nubilato').order('username'),
    ]);
    if (c) setContributi(c);
    if (s) setSpese(s);
    if (p) setProfili(p);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { await supabase.auth.signOut().catch(() => {}); window.location.assign('/login'); return; }
        const { data: profilo } = await supabase.from('profili').select('admin, admin_nubilato, gruppo').eq('id', session.user.id).single();
        if (profilo?.gruppo !== 'nubilato' && !profilo?.admin) { window.location.assign('/'); return; }
        if (profilo?.admin || profilo?.admin_nubilato) setIsAdmin(true);
        await caricaDati();
        setLoading(false);
      } catch { await supabase.auth.signOut().catch(() => {}); window.location.assign('/login'); }
    };
    init();
  }, []);

  // === CALCOLI ===
  const totaleConto = contributi.reduce((sum, c) => sum + Number(c.importo), 0);
  const totaleSpesePagate = spese.filter(s => s.pagata).reduce((sum, s) => sum + Number(s.importo), 0);
  const totaleSpesePreviste = spese.filter(s => !s.pagata).reduce((sum, s) => sum + Number(s.importo), 0);
  const disponibile = totaleConto - totaleSpesePagate;
  const disponibileReale = disponibile - totaleSpesePreviste;

  // Contributi per persona
  const contributiPerPersona: Record<string, number> = {};
  contributi.forEach(c => { contributiPerPersona[c.username] = (contributiPerPersona[c.username] || 0) + Number(c.importo); });

  // Calcolo quote spese per persona
  const calcolaQuotePerPersona = () => {
    const quote: Record<string, number> = {};
    profili.forEach(p => { quote[p.username] = 0; });

    spese.forEach(s => {
      const importo = Number(s.importo);
      const esclusi = s.esclusi || [];
      const inclusi = profili.filter(p => !esclusi.includes(p.username)).map(p => p.username);
      const numInclusi = inclusi.length;
      const includeFest = s.include_festeggiato;

      if (numInclusi === 0) return;

      if (includeFest) {
        // Totale persone che dividono = inclusi + festeggiato
        const totaleDivisione = numInclusi + 1;
        const quotaBase = importo / totaleDivisione;
        // Ogni incluso paga la sua quota
        inclusi.forEach(nome => { quote[nome] += quotaBase; });
        // La quota del festeggiato viene divisa tra TUTTI gli 8 partecipanti
        const quotaFestDivisa = quotaBase / TUTTI_PARTECIPANTI;
        profili.forEach(p => { quote[p.username] += quotaFestDivisa; });
      } else {
        // Divisione semplice tra gli inclusi
        const quotaBase = importo / numInclusi;
        inclusi.forEach(nome => { quote[nome] += quotaBase; });
      }
    });

    return quote;
  };

  const quotePerPersona = calcolaQuotePerPersona();
  const rimborsiPerPersona: Record<string, number> = {};
  profili.forEach(p => {
    const versato = contributiPerPersona[p.username] || 0;
    const speso = quotePerPersona[p.username] || 0;
    rimborsiPerPersona[p.username] = versato - speso;
  });
  const rimborsoMedio = profili.length > 0 ? Object.values(rimborsiPerPersona).reduce((a, b) => a + b, 0) / profili.length : 0;

  // Per categoria
  const spesePerCategoria = (cat: string) => spese.filter(s => s.categoria === cat).reduce((sum, s) => sum + Number(s.importo), 0);
  const totaleSpeseTutte = spese.reduce((sum, s) => sum + Number(s.importo), 0);

  // === FORM HANDLERS ===
  const resetFormContributo = () => { setCUserId(''); setCImporto(''); setCData(new Date().toISOString().split('T')[0]); setCNote(''); setEditingContributoId(null); setShowFormContributo(false); };
  const resetFormSpesa = () => { setSDescrizione(''); setSImporto(''); setSData(new Date().toISOString().split('T')[0]); setSCategoria('svago'); setSPagata(true); setSNote(''); setSEsclusi([]); setSIncludeFesteggiato(false); setEditingSpesaId(null); setShowFormSpesa(false); };

  const editContributo = (c: Contributo) => {
    setCUserId(c.user_id); setCImporto(String(c.importo)); setCData(c.data); setCNote(c.note || '');
    setEditingContributoId(c.id); setShowFormContributo(true);
  };

  const editSpesa = (s: Spesa) => {
    setSDescrizione(s.descrizione); setSImporto(String(s.importo)); setSData(s.data);
    setSCategoria(s.categoria as any); setSPagata(s.pagata); setSNote(s.note || '');
    setSEsclusi(s.esclusi || []); setSIncludeFesteggiato(s.include_festeggiato);
    setEditingSpesaId(s.id); setShowFormSpesa(true);
  };

  const salvaContributo = async () => {
    if (!cUserId || !cImporto) return mostraFeedback('Seleziona persona e importo', 'error');
    const profilo = profili.find(p => p.id === cUserId);
    const payload = { user_id: cUserId, username: profilo?.username || '', importo: parseFloat(cImporto), data: cData, note: cNote || null, gruppo: 'nubilato' };
    if (editingContributoId) {
      await supabase.from('contributi').update(payload).eq('id', editingContributoId);
      mostraFeedback('Contributo aggiornato! ✏️', 'success');
    } else {
      await supabase.from('contributi').insert(payload);
      mostraFeedback('Contributo aggiunto! 💰', 'success');
    }
    resetFormContributo(); caricaDati();
  };

  const salvaSpesa = async () => {
    if (!sDescrizione || !sImporto) return mostraFeedback('Descrizione e importo obbligatori', 'error');
    const numPersoneIncluse = profili.filter(p => !sEsclusi.includes(p.username)).length;
    const payload = { descrizione: sDescrizione, importo: parseFloat(sImporto), data: sData, categoria: sCategoria, pagata: sPagata, note: sNote || null, esclusi: sEsclusi, include_festeggiato: sIncludeFesteggiato, num_persone: numPersoneIncluse + (sIncludeFesteggiato ? 1 : 0), gruppo: 'nubilato' };
    if (editingSpesaId) {
      await supabase.from('spese').update(payload).eq('id', editingSpesaId);
      mostraFeedback('Spesa aggiornata! ✏️', 'success');
    } else {
      await supabase.from('spese').insert(payload);
      mostraFeedback('Spesa aggiunta! 📝', 'success');
    }
    resetFormSpesa(); caricaDati();
  };

  const elimina = async (id: string, tipo: 'contributo' | 'spesa') => {
    await supabase.from(tipo === 'contributo' ? 'contributi' : 'spese').delete().eq('id', id);
    mostraFeedback('Eliminato! 🗑️', 'success'); setConfirmDeleteId(null); caricaDati();
  };

  const toggleEscluso = (username: string) => {
    setSEsclusi(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
  };

  const categoriaLabel = (c: string) => c === 'alloggio' ? '🏠 Alloggio' : c === 'voli_trasporti' ? '✈️ Voli/Trasporti' : '🎉 Svago';
  const categoriaColor = (c: string) => c === 'alloggio' ? 'bg-blue-50 text-blue-600 border-blue-100' : c === 'voli_trasporti' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" /></div>;

  return (
    <main className="flex min-h-screen flex-col p-4 bg-slate-50 text-slate-900 pb-24">
      {feedback && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl whitespace-nowrap ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {feedback.text}
        </div>
      )}

      {/* Popup Rimborsi */}
      {showRimborsoPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRimborsoPopup(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">🔄 Rimborso per Persona</h2>
              <button onClick={() => setShowRimborsoPopup(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              {profili.map(p => {
                const rimborso = rimborsiPerPersona[p.username] || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-bold text-slate-700">{p.username}</span>
                    <span className={`text-sm font-black ${rimborso >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {rimborso >= 0 ? '+' : ''}€{rimborso.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 text-center">Positivo = rimborso dovuto · Negativo = deve ancora</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/nubilato" className="text-slate-500 font-semibold flex items-center gap-1"><ArrowLeft size={18} /> Home</Link>
        <h1 className="text-lg font-black tracking-tight">💰 Gestione Spese</h1>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white p-1 rounded-2xl border border-slate-100">
        {(['dashboard', 'contributi', 'spese', 'analisi'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            {t === 'dashboard' ? '📊' : t === 'contributi' ? '💶' : t === 'spese' ? '📝' : '📈'} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* === DASHBOARD === */}
      {tab === 'dashboard' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1"><PiggyBank size={14} className="text-amber-500" /><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conto Comune</p></div>
              <p className="text-2xl font-black text-slate-800">€{totaleConto.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-red-500" /><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Speso</p></div>
              <p className="text-2xl font-black text-red-600">€{totaleSpesePagate.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1"><Wallet size={14} className="text-amber-600" /><p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Disponibile</p></div>
              <p className={`text-2xl font-black ${disponibile >= 0 ? 'text-amber-600' : 'text-red-600'}`}>€{disponibile.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-orange-500" /><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previste</p></div>
              <p className="text-2xl font-black text-orange-500">€{totaleSpesePreviste.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">💚 Utilizzabile (dopo spese previste)</p>
            <p className="text-white text-3xl font-black">€{disponibileReale.toFixed(2)}</p>
          </div>

          <button onClick={() => setShowRimborsoPopup(true)} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg text-left active:scale-[0.98] transition-all">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">🔄 Rimborso previsto medio — tocca per dettaglio</p>
            <p className="text-white text-3xl font-black">€{rimborsoMedio.toFixed(2)}</p>
          </button>

          {/* Contributi per persona */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">💶 Contributi per persona</p>
            <div className="space-y-2">
              {profili.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{p.username}</span>
                  <span className={`text-sm font-black ${(contributiPerPersona[p.username] || 0) > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                    €{(contributiPerPersona[p.username] || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === CONTRIBUTI === */}
      {tab === 'contributi' && (
        <div className="space-y-3">
          {isAdmin && (showFormContributo ? (
            <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-amber-400 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{editingContributoId ? '✏️ Modifica' : '💶 Nuovo'} Contributo</p>
                <button onClick={resetFormContributo}><X size={18} className="text-slate-400" /></button>
              </div>
              <select value={cUserId} onChange={e => setCUserId(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-amber-400">
                <option value="">Seleziona persona...</option>
                {profili.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Importo (€)" value={cImporto} onChange={e => setCImporto(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-amber-400" />
              <input type="date" value={cData} onChange={e => setCData(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-amber-400" />
              <input type="text" placeholder="Note (opzionale)" value={cNote} onChange={e => setCNote(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-amber-400" />
              <button onClick={salvaContributo} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold active:scale-95 transition-all">
                {editingContributoId ? '✏️ Salva Modifiche' : '✅ Aggiungi Contributo'}
              </button>
            </div>
          ) : (
            <button onClick={() => { resetFormContributo(); setShowFormContributo(true); }}
              className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> Aggiungi Contributo
            </button>
          ))}

          {contributi.length === 0 ? (
            <div className="text-center py-10 text-slate-400"><p className="text-4xl mb-2">💶</p><p className="font-bold">Nessun contributo ancora</p></div>
          ) : (
            <div className="space-y-2">
              {contributi.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{c.username}</p>
                      <p className="text-[11px] text-slate-400">{new Date(c.data).toLocaleDateString('it-IT')} {c.note && `· ${c.note}`}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-black text-emerald-600">+€{Number(c.importo).toFixed(2)}</span>
                      {isAdmin && (
                        <>
                          <button onClick={() => editContributo(c)} className="p-1 text-slate-300 hover:text-amber-500"><Pencil size={14} /></button>
                          {confirmDeleteId === c.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => elimina(c.id, 'contributo')} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Sì</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(c.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === SPESE === */}
      {tab === 'spese' && (
        <div className="space-y-3">
          {isAdmin && (showFormSpesa ? (
            <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-red-400 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">{editingSpesaId ? '✏️ Modifica' : '📝 Nuova'} Spesa</p>
                <button onClick={resetFormSpesa}><X size={18} className="text-slate-400" /></button>
              </div>
              <input type="text" placeholder="Descrizione" value={sDescrizione} onChange={e => setSDescrizione(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-red-400" />
              <input type="number" step="0.01" placeholder="Importo (€)" value={sImporto} onChange={e => setSImporto(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-red-400" />
              <input type="date" value={sData} onChange={e => setSData(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-red-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['alloggio', 'voli_trasporti', 'svago'] as const).map(cat => (
                    <button key={cat} onClick={() => setSCategoria(cat)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${sCategoria === cat ? (cat === 'alloggio' ? 'bg-blue-600 text-white' : cat === 'voli_trasporti' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white') : 'bg-slate-100 text-slate-500'}`}>
                      {cat === 'alloggio' ? '🏠' : cat === 'voli_trasporti' ? '✈️' : '🎉'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stato</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSPagata(true)} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${sPagata ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>✅ Pagata</button>
                  <button onClick={() => setSPagata(false)} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${!sPagata ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>⏳ Prevista</button>
                </div>
              </div>
              {/* Escludi persone */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Partecipanti (tocca per escludere)</p>
                <div className="flex flex-wrap gap-2">
                  {profili.map(p => {
                    const escluso = sEsclusi.includes(p.username);
                    return (
                      <button key={p.id} onClick={() => toggleEscluso(p.username)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${escluso ? 'bg-red-50 text-red-400 border-red-200 line-through' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {p.username}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{profili.length - sEsclusi.length} persone incluse</p>
              </div>
              {/* Include festeggiato */}
              <button onClick={() => setSIncludeFesteggiato(!sIncludeFesteggiato)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all border ${sIncludeFesteggiato ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                🎉 {sIncludeFesteggiato ? 'Include festeggiato ✓' : 'Include anche il festeggiato?'}
              </button>
              <input type="text" placeholder="Note (opzionale)" value={sNote} onChange={e => setSNote(e.target.value)}
                className="w-full p-3 border rounded-xl bg-slate-50 text-base outline-none focus:ring-2 ring-red-400" />
              <button onClick={salvaSpesa} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold active:scale-95 transition-all">
                {editingSpesaId ? '✏️ Salva Modifiche' : '✅ Aggiungi Spesa'}
              </button>
            </div>
          ) : (
            <button onClick={() => { resetFormSpesa(); setShowFormSpesa(true); }}
              className="w-full bg-red-500 text-white rounded-2xl py-4 font-bold shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> Aggiungi Spesa
            </button>
          ))}

          {/* Lista spese */}
          {spese.length === 0 ? (
            <div className="text-center py-10 text-slate-400"><p className="text-4xl mb-2">📝</p><p className="font-bold">Nessuna spesa registrata</p></div>
          ) : (
            <>
              {spese.filter(s => !s.pagata).length > 0 && (
                <>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2">⏳ Spese Previste</p>
                  {spese.filter(s => !s.pagata).map(s => renderSpesa(s, true))}
                </>
              )}
              {spese.filter(s => s.pagata).length > 0 && (
                <>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">✅ Spese Pagate</p>
                  {spese.filter(s => s.pagata).map(s => renderSpesa(s, false))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* === ANALISI === */}
      {tab === 'analisi' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">📈 Ripartizione per Categoria</p>
            {totaleSpeseTutte === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nessuna spesa ancora</p>
            ) : (
              <div className="space-y-4">
                {[{ cat: 'alloggio', label: '🏠 Alloggio', color: 'bg-blue-500', text: 'text-blue-600' },
                  { cat: 'voli_trasporti', label: '✈️ Voli/Trasporti', color: 'bg-purple-500', text: 'text-purple-600' },
                  { cat: 'svago', label: '🎉 Svago', color: 'bg-emerald-500', text: 'text-emerald-600' }].map(({ cat, label, color, text }) => {
                  const val = spesePerCategoria(cat);
                  const pct = totaleSpeseTutte > 0 ? (val / totaleSpeseTutte) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-bold ${text}`}>{label}</span>
                        <span className={`text-sm font-black ${text}`}>€{val.toFixed(2)} <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3"><div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quote per persona */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">🔄 Situazione per Persona</p>
            <div className="space-y-3">
              {profili.map(p => {
                const versato = contributiPerPersona[p.username] || 0;
                const speso = quotePerPersona[p.username] || 0;
                const rimborso = rimborsiPerPersona[p.username] || 0;
                return (
                  <div key={p.id} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-700">{p.username}</span>
                      <span className={`text-sm font-black ${rimborso >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rimborso >= 0 ? '+' : ''}€{rimborso.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Versato: €{versato.toFixed(2)}</span>
                      <span>Quote: €{speso.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riepilogo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📋 Riepilogo</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Totale versato</span><span className="font-black text-emerald-600">€{totaleConto.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Totale speso</span><span className="font-black text-red-600">€{totaleSpesePagate.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Spese previste</span><span className="font-black text-orange-500">€{totaleSpesePreviste.toFixed(2)}</span></div>
              <div className="h-px bg-slate-100 my-1" />
              <div className="flex justify-between"><span className="text-slate-500">Disponibile ora</span><span className="font-black text-amber-600">€{disponibile.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Utilizzabile</span><span className="font-black text-emerald-600">€{disponibileReale.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  function renderSpesa(s: Spesa, isPrevista: boolean) {
    const esclusi = s.esclusi || [];
    const numInclusi = profili.length - esclusi.length;
    return (
      <div key={s.id} className={`rounded-2xl p-4 border shadow-sm ${isPrevista ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 truncate">{s.descrizione}</p>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${categoriaColor(s.categoria)}`}>{categoriaLabel(s.categoria)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date(s.data).toLocaleDateString('it-IT')}
              {' · '}{numInclusi}/{profili.length} persone
              {s.include_festeggiato && ' · 🎉 +festeggiato'}
              {s.note && ` · ${s.note}`}
            </p>
            {esclusi.length > 0 && (
              <p className="text-[10px] text-red-400 mt-0.5">Esclusi: {esclusi.join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className={`text-lg font-black ${isPrevista ? 'text-orange-500' : 'text-red-600'}`}>
              {isPrevista ? '' : '-'}€{Number(s.importo).toFixed(2)}
            </span>
            {isAdmin && (
              <>
                <button onClick={() => editSpesa(s)} className="p-1 text-slate-300 hover:text-amber-500"><Pencil size={14} /></button>
                {confirmDeleteId === s.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => elimina(s.id, 'spesa')} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Sì</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(s.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}