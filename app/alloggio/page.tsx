'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Calendar, Info, ExternalLink, Star, ChevronLeft, ChevronRight, X, Pencil, Check, Clock, Users, Wifi, Coffee, Shield } from 'lucide-react';

const ICONE_SERVIZI: Record<string, string> = {
    'Wi-Fi gratuito': '📶', 'Bar': '🍺', 'Pulizie giornaliere': '🧹',
    'Reception 24h': '🔔', 'Tavolo da biliardo': '🎱', 'Angolo caffè': '☕',
    'Cassetta di sicurezza': '🔒', 'Supporto escursioni': '🗺️',
    'Spa': '🧖', 'Palestra': '💪', 'Ristorante': '🍽️',
    'Parcheggio': '🅿️', 'Aria condizionata': '❄️', 'Piscina': '🏊',
};

export default function AlloggioPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [alloggio, setAlloggio] = useState<any>(null);
    const [fotoIndex, setFotoIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Campi form modifica
    const [formNome, setFormNome] = useState('');
    const [formIndirizzo, setFormIndirizzo] = useState('');
    const [formDescrizione, setFormDescrizione] = useState('');
    const [formCheckInOra, setFormCheckInOra] = useState('');
    const [formCheckOutOra, setFormCheckOutOra] = useState('');
    const [formNote, setFormNote] = useState('');
    const [formLinkMappa, setFormLinkMappa] = useState('');
    const [formLinkExpedia, setFormLinkExpedia] = useState('');
    const [formServiziTxt, setFormServiziTxt] = useState('');
    const [formFotoTxt, setFormFotoTxt] = useState('');

    const scaricaDati = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: prof } = await supabase.from('profili').select('admin').eq('id', session.user.id).single();
            if (prof?.admin) setIsAdmin(true);
        }
        const { data } = await supabase.from('alloggi').select('*').order('check_in', { ascending: true }).limit(1).single();
        if (data) {
            setAlloggio(data);
            setFormNome(data.nome || '');
            setFormIndirizzo(data.indirizzo || '');
            setFormDescrizione(data.descrizione || '');
            setFormCheckInOra(data.check_in_ora || '');
            setFormCheckOutOra(data.check_out_ora || '');
            setFormNote(data.note || '');
            setFormLinkMappa(data.link_mappa || '');
            setFormLinkExpedia(data.link_expedia || '');
            setFormServiziTxt((data.servizi || []).join('\n'));
            setFormFotoTxt((data.foto || []).map((f: any) => `${f.url}|${f.didascalia}`).join('\n'));
        }
        setLoading(false);
    };

    useEffect(() => { scaricaDati(); }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const salvaModifiche = async () => {
        if (!alloggio) return;
        setIsSaving(true);

        const servizi = formServiziTxt.split('\n').map(s => s.trim()).filter(Boolean);
        const foto = formFotoTxt.split('\n').map(r => {
            const [url, didascalia] = r.split('|');
            return { url: url?.trim(), didascalia: didascalia?.trim() || '' };
        }).filter(f => f.url);

        const { error } = await supabase.from('alloggi').update({
            nome: formNome,
            indirizzo: formIndirizzo,
            descrizione: formDescrizione,
            check_in_ora: formCheckInOra,
            check_out_ora: formCheckOutOra,
            note: formNote,
            link_mappa: formLinkMappa,
            link_expedia: formLinkExpedia,
            servizi,
            foto,
        }).eq('id', alloggio.id);

        if (error) mostraFeedback('Errore durante il salvataggio.', 'error');
        else { mostraFeedback('Alloggio aggiornato! ✅', 'success'); setIsEditing(false); scaricaDati(); }
        setIsSaving(false);
    };

    const foto: any[] = alloggio?.foto || [];
    const servizi: string[] = alloggio?.servizi || [];

    const prevFoto = () => setFotoIndex(i => (i - 1 + foto.length) % foto.length);
    const nextFoto = () => setFotoIndex(i => (i + 1) % foto.length);

    const formatData = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!alloggio) return (
        <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
            <p className="text-6xl mb-4">🏠</p>
            <p className="text-slate-400 font-bold text-lg">Nessun alloggio ancora inserito.</p>
            <Link href="/" className="mt-6 text-blue-600 font-bold">← Home</Link>
        </main>
    );

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">

            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* GALLERY FOTO */}
            {foto.length > 0 && (
                <div className="relative w-full h-64 bg-slate-900 overflow-hidden">
                    <img
                        src={foto[fotoIndex]?.url}
                        alt={foto[fotoIndex]?.didascalia}
                        className="w-full h-full object-cover opacity-90 transition-all duration-500"
                    />
                    {/* Didascalia */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-xs font-bold">{foto[fotoIndex]?.didascalia}</p>
                        <p className="text-white/60 text-[10px]">{fotoIndex + 1} / {foto.length}</p>
                    </div>
                    {/* Navigazione */}
                    {foto.length > 1 && (
                        <>
                            <button onClick={prevFoto} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextFoto} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all">
                                <ChevronRight size={20} />
                            </button>
                            {/* Dots */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {foto.map((_: any, i: number) => (
                                    <button key={i} onClick={() => setFotoIndex(i)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === fotoIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                    {/* Header nav overlay */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
                        <Link href="/" className="bg-black/40 text-white px-3 py-1.5 rounded-xl text-sm font-bold backdrop-blur-sm">
                            ← Home
                        </Link>
                        {isAdmin && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="bg-black/40 text-white px-3 py-1.5 rounded-xl text-sm font-bold backdrop-blur-sm flex items-center gap-1.5"
                            >
                                <Pencil size={14} /> {isEditing ? 'Annulla' : 'Modifica'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto p-6 space-y-5">

                {/* Header senza foto */}
                {foto.length === 0 && (
                    <div className="flex items-center justify-between mb-2">
                        <Link href="/" className="text-blue-600 font-bold">← Home</Link>
                        {isAdmin && (
                            <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                                <Pencil size={15} /> {isEditing ? 'Annulla' : 'Modifica'}
                            </button>
                        )}
                    </div>
                )}

                {/* FORM MODIFICA (solo admin) */}
                {isEditing && (
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border-2 border-blue-400 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">✏️ Modifica Alloggio</p>

                        {[
                            { label: 'Nome struttura', value: formNome, set: setFormNome, placeholder: 'Es: Travel Hotel Amsterdam' },
                            { label: 'Indirizzo', value: formIndirizzo, set: setFormIndirizzo, placeholder: 'Via...' },
                            { label: 'Link Google Maps', value: formLinkMappa, set: setFormLinkMappa, placeholder: 'https://...' },
                            { label: 'Link Expedia', value: formLinkExpedia, set: setFormLinkExpedia, placeholder: 'https://...' },
                            { label: 'Ora Check-in', value: formCheckInOra, set: setFormCheckInOra, placeholder: '14:00' },
                            { label: 'Ora Check-out', value: formCheckOutOra, set: setFormCheckOutOra, placeholder: '10:00' },
                        ].map(({ label, value, set, placeholder }) => (
                            <div key={label}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{label}</label>
                                <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                                    className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                            </div>
                        ))}

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrizione</label>
                            <textarea value={formDescrizione} onChange={e => setFormDescrizione(e.target.value)} rows={3}
                                className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Servizi (uno per riga)</label>
                            <textarea value={formServiziTxt} onChange={e => setFormServiziTxt(e.target.value)} rows={4}
                                placeholder={"Wi-Fi gratuito\nBar\nReception 24h"}
                                className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Foto (url|didascalia, una per riga)</label>
                            <textarea value={formFotoTxt} onChange={e => setFormFotoTxt(e.target.value)} rows={4}
                                placeholder={"https://img.jpg|Esterni\nhttps://img2.jpg|Camera"}
                                className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Note importanti</label>
                            <textarea value={formNote} onChange={e => setFormNote(e.target.value)} rows={3}
                                className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <button onClick={salvaModifiche} disabled={isSaving}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2">
                            <Check size={18} /> {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                )}

                {/* NOME + STELLE + RATING */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight leading-tight">{alloggio.nome}</h1>
                            {alloggio.stelle && (
                                <div className="flex items-center gap-0.5 mt-1">
                                    {Array.from({ length: Math.round(alloggio.stelle) }).map((_, i) => (
                                        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                            )}
                        </div>
                        {alloggio.rating && (
                            <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl text-center shrink-0">
                                <p className="text-xl font-black leading-none">{alloggio.rating}</p>
                                <p className="text-[9px] font-bold opacity-80 mt-0.5">/10</p>
                            </div>
                        )}
                    </div>
                    {alloggio.rating_count && (
                        <p className="text-xs text-slate-400 font-bold mb-4">{alloggio.rating_count} recensioni su Expedia</p>
                    )}
                    {alloggio.descrizione && (
                        <p className="text-sm text-slate-600 leading-relaxed">{alloggio.descrizione}</p>
                    )}
                </div>

                {/* CHECK-IN / CHECK-OUT */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-in</p>
                        <p className="font-black text-slate-800 text-sm leading-snug">{formatData(alloggio.check_in)}</p>
                        {alloggio.check_in_ora && (
                            <p className="text-blue-600 font-black text-lg mt-1 flex items-center gap-1">
                                <Clock size={14} /> {alloggio.check_in_ora}
                            </p>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-out</p>
                        <p className="font-black text-slate-800 text-sm leading-snug">{formatData(alloggio.check_out)}</p>
                        {alloggio.check_out_ora && (
                            <p className="text-blue-600 font-black text-lg mt-1 flex items-center gap-1">
                                <Clock size={14} /> {alloggio.check_out_ora}
                            </p>
                        )}
                    </div>
                </div>

                {/* SERVIZI */}
                {servizi.length > 0 && (
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Servizi</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {servizi.map((s: string) => (
                                <div key={s} className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-xl">
                                    <span className="text-base">{ICONE_SERVIZI[s] || '✓'}</span>
                                    <span className="text-xs font-bold text-slate-700">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NOTE IMPORTANTI */}
                {alloggio.note && (
                    <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                        <div className="flex items-center gap-2 mb-3 text-amber-700">
                            <Info size={18} />
                            <p className="font-black text-xs uppercase tracking-widest">Note Importanti</p>
                        </div>
                        <p className="text-amber-900 text-sm leading-relaxed">{alloggio.note}</p>
                    </div>
                )}

                {/* PULSANTI AZIONE */}
                <div className="space-y-3">
                    {alloggio.link_mappa && (
                        <a href={alloggio.link_mappa} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                            <MapPin size={20} /> Apri in Google Maps
                        </a>
                    )}
                    {alloggio.link_expedia && (
                        <a href={alloggio.link_expedia} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 py-4 rounded-2xl font-bold border-2 border-blue-100 shadow-sm active:scale-95 transition-all">
                            <ExternalLink size={18} /> Vedi su Expedia
                        </a>
                    )}
                </div>
            </div>
        </main>
    );
}