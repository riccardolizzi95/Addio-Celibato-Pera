'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Foto {
  id: string
  tavolo: number
  titolo: string
  nome_persona: string
  public_url: string
  n_voti_pubblico: number
}

export default function VotaPage() {
  const [foto, setFoto] = useState<Foto | null>(null)
  const [loading, setLoading] = useState(true)
  const [voto, setVoto] = useState(7)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [fotoId, setFotoId] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [tavoloVotante, setTavoloVotante] = useState<number | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const currentFotoIdRef = useRef<string | null>(null)
  const tavoloRef = useRef<number | null>(null)

  const loadFoto = useCallback(async (id: string) => {
    const r = await fetch('/api/contest-foto/voti')
    const data = await r.json()
    const f = data.fotos?.find((f: Foto) => f.id === id)
    if (f) setFoto(f)
  }, [])

  // Polling: controlla se la foto corrente è cambiata nella presentazione
  const pollStato = useCallback(async () => {
    try {
      const r = await fetch('/api/contest-foto/stato')
      const data = await r.json()
      if (!data.attiva) return // presentazione non attiva
      const nuovaFotoId = data.foto_corrente_id
      if (nuovaFotoId && nuovaFotoId !== currentFotoIdRef.current) {
        // Foto cambiata! Aggiorna
        currentFotoIdRef.current = nuovaFotoId
        setTransitioning(true)
        setFotoId(nuovaFotoId)
        // Controlla se ha già votato questa nuova foto
        const alreadyVoted = localStorage.getItem(`voted_${nuovaFotoId}`)
        setDone(!!alreadyVoted)
        setVoto(7)
        await loadFoto(nuovaFotoId)
        setTimeout(() => setTransitioning(false), 400)
      }
    } catch { /* ignora errori di polling */ }
  }, [loadFoto])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('foto_id')
    const t = parseInt(params.get('tavolo') ?? '0')
    if (!id) { setErr('QR code non valido.'); setLoading(false); return }
    setFotoId(id)
    currentFotoIdRef.current = id
    if (t >= 1 && t <= 9) {
      setTavoloVotante(t)
      tavoloRef.current = t
    }

    // Controlla se ha già votato
    const voted = localStorage.getItem(`voted_${id}`)
    if (voted) { setDone(true) }

    fetch('/api/contest-foto/voti')
      .then(r => r.json())
      .then(data => {
        const f = data.fotos?.find((f: Foto) => f.id === id)
        if (f) setFoto(f)
        else setErr('Foto non trovata.')
      })
      .catch(() => setErr('Errore nel caricamento.'))
      .finally(() => setLoading(false))

    // Avvia polling stato ogni 3 secondi
    pollRef.current = setInterval(pollStato, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [pollStato])

  // Genera fingerprint dal device
  function getFingerprint(): string {
    const stored = localStorage.getItem('cf_device_id')
    if (stored) return stored
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('cf_device_id', id)
    return id
  }

  async function handleVota() {
    if (!fotoId || !foto) return
    setSending(true)
    setErr(null)
    try {
      const r = await fetch('/api/contest-foto/vota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto_id: fotoId,
          tavolo_foto: foto.tavolo,
          tipo: 'pubblico',
          valore: voto,
          device_fingerprint: getFingerprint(),
          tavolo_votante: tavoloVotante
        })
      })
      const data = await r.json()
      if (data.alreadyVoted || data.limitReached) {
        setDone(true)
        localStorage.setItem(`voted_${fotoId}`, '1')
        return
      }
      if (!r.ok) throw new Error(data.error)
      localStorage.setItem(`voted_${fotoId}`, '1')
      setDone(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSending(false)
    }
  }

  const stars = [1,2,3,4,5,6,7,8,9,10]

  if (transitioning) return (
    <div style={s.center}>
      <div style={{ fontSize: 44, marginBottom: 20, animation: 'spin 0.5s linear' }}>✨</div>
      <p style={s.loadText}>Prossima foto...</p>
    </div>
  )

  if (loading) return (
    <div style={s.center}>
      <div style={s.ring}>💍</div>
      <p style={s.loadText}>Caricamento...</p>
    </div>
  )

  if (err && !foto) return (
    <div style={s.center}>
      <div style={s.ring}>💍</div>
      <h2 style={s.errTitle}>Ops</h2>
      <p style={s.errText}>{err}</p>
    </div>
  )

  if (done) return (
    <div style={s.center}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✨</div>
      <h2 style={s.doneTitle}>Grazie!</h2>
      <p style={s.doneText}>Il tuo voto è stato registrato.<br />Segui la classifica sulla proiezione.</p>
      {foto && (
        <div style={s.doneBadge}>Tavolo {foto.tavolo} · {foto.titolo}</div>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500&display=swap');
        @keyframes spin { from { transform: scale(0.5) rotate(0deg); opacity: 0; } to { transform: scale(1) rotate(360deg); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .cf-photo-wrap { animation: fadeIn 0.4s ease; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }
        body { background: #faf7f2; }
      `}</style>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.ornament}>✦</div>
          <h1 style={s.title}>Vota la foto</h1>
          <div style={s.tavoloBadge}>Tavolo {foto?.tavolo}</div>
          {tavoloVotante && (
            <div style={s.tavoloVotanteBadge}>Stai votando dal Tavolo {tavoloVotante}</div>
          )}
        </div>

        {/* Foto */}
        {foto && (
          <div style={s.photoWrap} className="cf-photo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.public_url} alt={foto.titolo} style={s.photo} />
            <div style={s.photoInfo}>
              <div style={s.photoTitle}>{foto.titolo}</div>
              <div style={s.photoMeta}>{foto.nome_persona}</div>
            </div>
          </div>
        )}

        {/* Voto */}
        <div style={s.votoSection}>
          <div style={s.votoLabel}>Il tuo voto</div>
          <div style={s.votoNumber}>{voto}<span style={s.votoMax}>/10</span></div>

          {/* Griglia numeri */}
          <div style={s.numGrid}>
            {stars.map(n => (
              <button
                key={n}
                style={{ ...s.numBtn, ...(voto === n ? s.numBtnActive : {}) }}
                onClick={() => setVoto(n)}
              >
                {n}
              </button>
            ))}
          </div>

          {err && <div style={s.errMsg}>{err}</div>}

          <button
            style={{ ...s.votoBtn, ...(sending ? s.votoBtnDisabled : {}) }}
            onClick={handleVota}
            disabled={sending}
          >
            {sending ? 'Invio...' : 'Conferma voto'}
          </button>

          <p style={s.hint}>Puoi votare una sola volta per questa foto.</p>
        </div>

        <div style={s.footer}>Yas ♥ Pera · 2025</div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'Jost, sans-serif', display: 'flex', flexDirection: 'column' },
  center: { minHeight: '100vh', background: '#faf7f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', fontFamily: 'Jost, sans-serif' },
  ring: { fontSize: 44, marginBottom: 20 },
  loadText: { fontSize: 13, color: '#9b8860', letterSpacing: 2 },
  errTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#1a1208', marginBottom: 12 },
  errText: { fontSize: 13, color: '#9b8860', lineHeight: 1.7 },
  doneTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1a1208', marginBottom: 12 },
  doneText: { fontSize: 14, color: '#9b8860', lineHeight: 1.8 },
  doneBadge: { marginTop: 20, padding: '8px 20px', background: '#1a1208', color: '#c4a46e', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' },

  header: { textAlign: 'center', padding: '36px 24px 20px', borderBottom: '1px solid rgba(196,164,110,0.2)', background: 'linear-gradient(180deg, #f5efe6 0%, #faf7f2 100%)' },
  ornament: { color: '#c4a46e', fontSize: 18, marginBottom: 10 },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#1a1208', letterSpacing: 2 },
  tavoloBadge: { display: 'inline-block', marginTop: 12, padding: '6px 20px', background: '#1a1208', color: '#c4a46e', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' },
  tavoloVotanteBadge: { display: 'inline-block', marginTop: 6, padding: '4px 14px', background: 'rgba(196,164,110,0.12)', border: '1px solid rgba(196,164,110,0.3)', color: '#8b6914', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const },

  photoWrap: { position: 'relative', overflow: 'hidden' },
  photo: { width: '100%', height: '45vw', maxHeight: 280, objectFit: 'cover', display: 'block' },
  photoInfo: { padding: '12px 20px', background: 'white', borderBottom: '1px solid rgba(196,164,110,0.2)' },
  photoTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1a1208' },
  photoMeta: { fontSize: 11, color: '#9b8860', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },

  votoSection: { padding: '28px 24px 20px', flex: 1 },
  votoLabel: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#9b8860', textAlign: 'center', marginBottom: 8 },
  votoNumber: { textAlign: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 72, fontWeight: 300, color: '#1a1208', lineHeight: 1 },
  votoMax: { fontSize: 28, color: '#c4a46e', marginLeft: 4 },

  numGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 20, marginBottom: 8 },
  numBtn: { padding: '14px 0', background: 'white', border: '1px solid rgba(196,164,110,0.35)', fontFamily: 'Jost, sans-serif', fontSize: 18, color: '#9b8860', cursor: 'pointer', touchAction: 'manipulation', borderRadius: 0 },
  numBtnActive: { background: '#1a1208', color: '#c4a46e', border: '1px solid #1a1208', fontWeight: 500 },

  errMsg: { background: 'rgba(160,60,50,0.06)', borderLeft: '2px solid #a03c32', padding: '10px 14px', color: '#7a2e25', fontSize: 13, marginTop: 12 },

  votoBtn: { width: '100%', marginTop: 20, padding: '16px', background: '#1a1208', color: '#c4a46e', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer', minHeight: 52, touchAction: 'manipulation', borderRadius: 0 },
  votoBtnDisabled: { background: '#c4b898', color: '#9b8860', cursor: 'not-allowed' },

  hint: { textAlign: 'center', fontSize: 11, color: '#c4b898', marginTop: 12, letterSpacing: 0.3 },
  footer: { textAlign: 'center', padding: '20px', fontFamily: 'Cormorant Garamond, serif', fontSize: 14, fontStyle: 'italic', color: '#c4a46e' },
}