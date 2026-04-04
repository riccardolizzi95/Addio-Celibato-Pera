'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Calendar, Info, ExternalLink, Star, ChevronLeft, ChevronRight, X, Pencil, Check, Clock, ArrowLeft } from 'lucide-react';

const ICONE_SERVIZI: Record<string, string> = {
    'Wi-Fi gratuito': '📶', 'Bar': '🍺', 'Pulizie giornaliere': '🧹',
    'Reception 24h': '🔔', 'Tavolo da biliardo': '🎱', 'Angolo caffè': '☕',
    'Cassetta di sicurezza': '🔒', 'Supporto escursioni': '🗺️',
    'Spa': '🧖', 'Palestra': '💪', 'Ristorante': '🍽️',
    'Parcheggio': '🅿️', 'Aria condizionata': '❄️', 'Piscina': '🏊',
};

function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    return (
        <div className={`relative ${className || ''}`}>
            {!loaded && !error && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-xl" />
            )}
            {error ? (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-xl">
                    <span className="text-3xl">🏠</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    );
}

export default function AlloggioPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [alloggio, setAlloggio] = useState<any>(null);
    const [fotoIndex, setFotoIndex] = useState(0);
    const [fullscreenFoto, setFullscreenFoto] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const galleryRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);

    // Form
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
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { await supabase.auth.signOut().catch(() => {}); window.location.assign('/login'); return; }
            const { data: prof } = await supabase.from('profili').select('admin').eq('id', session.user.id).single();
            if (prof?.admin) setIsAdmin(true);
            const { data } = await supabase.from('alloggi').select('*').eq('gruppo', 'celibato').order('check_in', { ascending: true }).limit(1).single();
            if (data) {
                setAlloggio(data);
                setFormNome(data.nome || ''); setFormIndirizzo(data.indirizzo || '');
                setFormDescrizione(data.descrizione || ''); setFormCheckInOra(data.check_in_ora || '');
                setFormCheckOutOra(data.check_out_ora || ''); setFormNote(data.note || '');
                setFormLinkMappa(data.link_mappa || ''); setFormLinkExpedia(data.link_expedia || '');
                setFormServiziTxt((data.servizi || []).join('\n'));
                setFormFotoTxt((data.foto || []).map((f: any) => `${f.url}|${f.didascalia}`).join('\n'));
            }
            setLoading(false);
        } catch { await supabase.auth.signOut().catch(() => {}); window.location.assign('/login'); }
    };

    useEffect(() => { scaricaDati(); }, []);

    const mostraFeedback = (text: string, type: 'success' | 'error') => {
        setFeedback({ text, type }); setTimeout(() => setFeedback(null), 3000);
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
            nome: formNome, indirizzo: formIndirizzo, descrizione: formDescrizione,
            check_in_ora: formCheckInOra, check_out_ora: formCheckOutOra, note: formNote,
            link_mappa: formLinkMappa, link_expedia: formLinkExpedia, servizi, foto,
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

    // Swipe touch handlers
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { diff > 0 ? nextFoto() : prevFoto(); }
    };

    // Countdown
    const getCountdown = () => {
        if (!alloggio?.check_in) return null;
        const diff = new Date(alloggio.check_in).getTime() - Date.now();
        if (diff <= 0) return null;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { days, hours };
    };
    const countdown = getCountdown();

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
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
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.text}
                </div>
            )}

            {/* FULLSCREEN FOTO */}
            {fullscreenFoto && foto.length > 0 && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setFullscreenFoto(false)}
                    onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    <button onClick={(e) => { e.stopPropagation(); setFullscreenFoto(false); }} className="absolute top-6 right-6 z-10 bg-white/20 backdrop-blur-md p-3 rounded-full"><X size={24} className="text-white" /></button>
                    <button onClick={(e) => { e.stopPropagation(); prevFoto(); }} className="absolute left-3 z-10 bg-white/20 backdrop-blur-md p-3 rounded-full"><ChevronLeft size={24} className="text-white" /></button>
                    <button onClick={(e) => { e.stopPropagation(); nextFoto(); }} className="absolute right-3 z-10 bg-white/20 backdrop-blur-md p-3 rounded-full"><ChevronRight size={24} className="text-white" /></button>
                    <img src={foto[fotoIndex]?.url} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-white font-bold text-sm">{foto[fotoIndex]?.didascalia}</p>
                        <div className="flex gap-1.5 justify-center mt-3">
                            {foto.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === fotoIndex ? 'bg-white w-5' : 'bg-white/40'}`} />)}
                        </div>
                    </div>
                </div>
            )}

            {/* GALLERY */}
            {foto.length > 0 && (
                <div className="relative w-full h-72 bg-slate-900 overflow-hidden" ref={galleryRef}
                    onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
                    onClick={() => setFullscreenFoto(true)}>
                    <LazyImage src={foto[fotoIndex]?.url} alt={foto[fotoIndex]?.didascalia || ''} className="w-full h-full" />
                    <div className="absolute top-4 left-4 z-10">
                        <Link href="/" onClick={e => e.stopPropagation()} className="bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg flex items-center justify-center">
                            <ArrowLeft size={18} className="text-slate-700" />
                        </Link>
                    </div>
                    {isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg">
                            <Pencil size={16} className="text-slate-700" />
                        </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-16">
                        <p className="text-white/80 text-xs font-bold">{foto[fotoIndex]?.didascalia}</p>
                        <div className="flex gap-1.5 mt-2">
                            {foto.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === fotoIndex ? 'bg-white w-6' : 'bg-white/40 w-1'}`} />)}
                        </div>
                    </div>
                    {foto.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); prevFoto(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full"><ChevronLeft size={20} className="text-white" /></button>
                            <button onClick={(e) => { e.stopPropagation(); nextFoto(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full"><ChevronRight size={20} className="text-white" /></button>
                        </>
                    )}
                </div>
            )}

            {/* Thumbnail strip */}
            {foto.length > 1 && (
                <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-slate-100">
                    {foto.map((f, i) => (
                        <button key={i} onClick={() => setFotoIndex(i)}
                            className={`shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === fotoIndex ? 'border-blue-500 shadow-md scale-105' : 'border-transparent opacity-60'}`}>
                            <img src={f.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Countdown */}
                {countdown && (
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg text-center">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">⏰ Mancano</p>
                        <div className="flex items-center justify-center gap-4">
                            <div>
                                <p className="text-white text-4xl font-black">{countdown.days}</p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase">giorni</p>
                            </div>
                            <p className="text-white/40 text-2xl font-bold">:</p>
                            <div>
                                <p className="text-white text-4xl font-black">{countdown.hours}</p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase">ore</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FORM MODIFICA (admin) */}
                {isEditing && (
                    <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-blue-400 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest">✏️ Modifica Alloggio</p>
                            <button onClick={() => setIsEditing(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        {[
                            { label: 'Nome', value: formNome, set: setFormNome },
                            { label: 'Indirizzo', value: formIndirizzo, set: setFormIndirizzo },
                            { label: 'Link Google Maps', value: formLinkMappa, set: setFormLinkMappa },
                            { label: 'Link Expedia', value: formLinkExpedia, set: setFormLinkExpedia },
                            { label: 'Ora Check-in', value: formCheckInOra, set: setFormCheckInOra },
                            { label: 'Ora Check-out', value: formCheckOutOra, set: setFormCheckOutOra },
                        ].map(({ label, value, set }) => (
                            <div key={label}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{label}</label>
                                <input type="text" value={value} onChange={e => set(e.target.value)}
                                    className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 ring-blue-400 text-sm font-medium" />
                            </div>
                        ))}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrizione</label>
                            <textarea value={formDescrizione} onChange={e => setFormDescrizione(e.target.value)} rows={3}
                                className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 ring-blue-400 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Servizi (uno per riga)</label>
                            <textarea value={formServiziTxt} onChange={e => setFormServiziTxt(e.target.value)} rows={4}
                                className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 ring-blue-400 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Foto (url|didascalia, una per riga)</label>
                            <textarea value={formFotoTxt} onChange={e => setFormFotoTxt(e.target.value)} rows={4}
                                className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 ring-blue-400 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Note importanti</label>
                            <textarea value={formNote} onChange={e => setFormNote(e.target.value)} rows={3}
                                className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 ring-blue-400 text-sm" />
                        </div>
                        <button onClick={salvaModifiche} disabled={isSaving}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2">
                            <Check size={18} /> {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                )}

                {/* NOME + RATING */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black tracking-tight leading-tight">{alloggio.nome}</h1>
                            {alloggio.stelle && (
                                <div className="flex items-center gap-0.5 mt-1">
                                    {Array.from({ length: Math.round(alloggio.stelle) }).map((_, i) => (
                                        <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                            )}
                            {alloggio.indirizzo && (
                                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><MapPin size={12} /> {alloggio.indirizzo}</p>
                            )}
                        </div>
                        {alloggio.rating && (
                            <div className="bg-blue-600 text-white px-3.5 py-2.5 rounded-2xl text-center shrink-0 ml-3">
                                <p className="text-xl font-black leading-none">{alloggio.rating}</p>
                                <p className="text-[9px] font-bold opacity-80 mt-0.5">/10</p>
                            </div>
                        )}
                    </div>
                    {alloggio.rating_count && (
                        <p className="text-[11px] text-slate-400 font-bold mt-2">{alloggio.rating_count} recensioni su Expedia</p>
                    )}
                    {alloggio.descrizione && (
                        <p className="text-sm text-slate-600 leading-relaxed mt-3">{alloggio.descrizione}</p>
                    )}
                </div>

                {/* CHECK-IN / CHECK-OUT */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">✅ Check-in</p>
                        <p className="font-bold text-slate-800 text-sm">{formatData(alloggio.check_in)}</p>
                        {alloggio.check_in_ora && (
                            <p className="text-blue-600 font-black text-lg mt-1 flex items-center gap-1"><Clock size={14} /> {alloggio.check_in_ora}</p>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">🚪 Check-out</p>
                        <p className="font-bold text-slate-800 text-sm">{formatData(alloggio.check_out)}</p>
                        {alloggio.check_out_ora && (
                            <p className="text-blue-600 font-black text-lg mt-1 flex items-center gap-1"><Clock size={14} /> {alloggio.check_out_ora}</p>
                        )}
                    </div>
                </div>

                {/* SERVIZI */}
                {servizi.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Servizi</h2>
                        <div className="flex flex-wrap gap-2">
                            {servizi.map((s: string) => (
                                <span key={s} className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-full text-xs font-bold text-slate-700 border border-slate-100">
                                    {ICONE_SERVIZI[s] || '✓'} {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* NOTE */}
                {alloggio.note && (
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-2 text-amber-700">
                            <Info size={16} />
                            <p className="font-black text-xs uppercase tracking-widest">Note Importanti</p>
                        </div>
                        <p className="text-amber-900 text-sm leading-relaxed">{alloggio.note}</p>
                    </div>
                )}

                {/* AZIONI */}
                <div className="space-y-3">
                    {alloggio.link_mappa && (
                        <a href={alloggio.link_mappa} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                            <MapPin size={18} /> Apri in Google Maps
                        </a>
                    )}
                    {alloggio.link_expedia && (
                        <a href={alloggio.link_expedia} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 py-4 rounded-2xl font-bold border-2 border-blue-100 shadow-sm active:scale-95 transition-all">
                            <ExternalLink size={16} /> Vedi su Expedia
                        </a>
                    )}
                </div>
            </div>
        </main>
    );
}