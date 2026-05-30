'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

interface FotoConVoti {
  id: string
  tavolo: number
  titolo: string
  nome_persona: string
  public_url: string
  voto_sposi: number | null
  voto_pubblico: number | null
  n_voti_pubblico: number
  punteggio_finale: number | null
  votata_sposi: boolean
}

type Fase = 'loading' | 'slideshow' | 'classifica'

export default function PresentazionePage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fotos, setFotos] = useState<FotoConVoti[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [fase, setFase] = useState<Fase>('loading')
  const [votoCorrente, setVotoCorrente] = useState(7)
  const [sending, setSending] = useState(false)
  const [classifica, setClassifica] = useState<FotoConVoti[]>([])
  const [pareggi, setPareggi] = useState<number[][]>([])
  const [qrUrl, setQrUrl] = useState<string>('')
  const [msg, setMsg] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [spareggio, setSpareggio] = useState(false)
  const [vincitoreId, setVincitoreId] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://matrimonio-yas-pera.vercel.app'

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setChecking(false); return }
      const { data: profilo } = await supabase.from('profili').select('admin').eq('id', session.user.id).single()
      if (profilo?.admin) { setIsAdmin(true); setToken(session.access_token) }
      setChecking(false)
    })
  }, [])

  // Aggiorna stato presentazione su Supabase
  const aggiornaStato = useCallback(async (attiva: boolean, foto_id: string | null) => {
    await fetch('/api/contest-foto/stato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attiva, foto_corrente_id: foto_id ?? null })
    })
  }, [])

  const loadVoti = useCallback(async () => {
    const r = await fetch('/api/contest-foto/voti')
    const data = await r.json()
    if (data.fotos) {
      // Aggiorna sempre le foto (per gestire sostituzioni durante la presentazione)
      setFotos(data.fotos)
      setClassifica(data.classifica ?? [])
      setPareggi(data.pareggi ?? [])
    }
  }, [])

  // Avvia presentazione
  async function startPresentation() {
    await loadVoti() // carica foto fresche
    setCurrentIdx(0)
    setFase('slideshow')
    pollRef.current = setInterval(loadVoti, 3000)
  }

  // Interrompi e resetta tutto
  async function handleReset() {
    setResetting(true)
    try {
      if (pollRef.current) clearInterval(pollRef.current)
      await fetch('/api/contest-foto/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      // Torna alla schermata iniziale
      setFase('loading')
      setCurrentIdx(0)
      setFotos([])
      setClassifica([])
      setPareggi([])
      setVotoCorrente(7)
      setConfirmReset(false)
      setQrUrl('')
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Genera QR per foto corrente + aggiorna stato presentazione
  useEffect(() => {
    if (fase !== 'slideshow' || !fotos[currentIdx]) return
    const fotoId = fotos[currentIdx].id
    const tavoloFoto = fotos[currentIdx].tavolo
    // QR punta al link del bigliettino — contest-foto lo reindirizza alla pagina voto
    const url = `${baseUrl}/contest-foto?tavolo=${tavoloFoto}`
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#1a1208', light: '#faf7f2' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''))
    // Aggiorna stato su Supabase — la pagina contest-foto leggerà questo
    aggiornaStato(true, fotoId)
  }, [currentIdx, fotos, fase, baseUrl, aggiornaStato])

  // Avvia stato quando entra in slideshow
  useEffect(() => {
    if (fase === 'slideshow' && fotos[currentIdx]) {
      aggiornaStato(true, fotos[currentIdx].id)
    }
    // Disattiva stato quando va in classifica o esce
    if (fase === 'classifica') {
      aggiornaStato(false, null)
    }
  }, [fase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup: disattiva stato quando si chiude la pagina
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon('/api/contest-foto/stato',
        JSON.stringify({ attiva: false, foto_corrente_id: null }))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      aggiornaStato(false, null)
    }
  }, [aggiornaStato])

  // Voto sposi
  async function votaSposi() {
    const foto = fotos[currentIdx]
    if (!foto) return
    setSending(true)
    try {
      await fetch('/api/contest-foto/vota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_id: foto.id, tavolo_foto: foto.tavolo, tipo: 'sposi', valore: votoCorrente })
      })
      await loadVoti()
      setMsg(`Voto ${votoCorrente}/10 registrato per Tavolo ${foto.tavolo}`)
      setTimeout(() => setMsg(null), 2000)
    } finally {
      setSending(false)
    }
  }

  function scegliVincitore(fotoId: string) {
    setVincitoreId(fotoId)
    // Riordina classifica: metti il vincitore prima degli altri pareggiati
    setClassifica(prev => {
      const pareggiatiFotoIds = pareggi[0] ? 
        prev.filter(f => {
          const top = prev[0].punteggio_finale ?? 0
          return Math.abs((f.punteggio_finale ?? 0) - top) < 0.001
        }).map(f => f.id) : []
      
      const vincitore = prev.find(f => f.id === fotoId)
      const altriPareggiati = prev.filter(f => pareggiatiFotoIds.includes(f.id) && f.id !== fotoId)
      const resto = prev.filter(f => !pareggiatiFotoIds.includes(f.id))
      
      return vincitore ? [vincitore, ...altriPareggiati, ...resto] : prev
    })
    setPareggi([])
    setSpareggio(false)
  }

  function goNext() {
    if (currentIdx < fotos.length - 1) {
      setCurrentIdx(i => i + 1)
      setVotoCorrente(7)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
      setFase('classifica')
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1)
      setVotoCorrente(7)
    }
  }

  const foto = fotos[currentIdx]
  const fotaVotata = foto ? fotos.find(f => f.id === foto.id) : null
  const hasVotoSposi = fotaVotata?.votata_sposi ?? false

  if (checking) return <div style={s.loadScreen}>Verifica accesso...</div>
  if (!isAdmin) return <div style={s.loadScreen}>🔒 Accesso non autorizzato</div>

  if (fase === 'loading') return (
    <div style={s.startScreen}>
      <div style={s.startInner}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>💍</div>
        <h1 style={s.startTitle}>Contest Fotografico</h1>
        <p style={s.startSub}>Yas ♥ Pera · 2025</p>
        <button style={s.startBtn} onClick={startPresentation}>
          ▶ Avvia Presentazione
        </button>
      </div>
    </div>
  )

  if (fase === 'classifica') {
    // Trova foto pareggiate al primo posto
    const fotePareggiate = pareggi.length > 0 && classifica.length >= 2
      ? classifica.filter(f => {
          const top = classifica[0].punteggio_finale ?? 0
          return Math.abs((f.punteggio_finale ?? 0) - top) < 0.001
        })
      : []

    return (
      <div style={s.clasScreen}>
        <div style={s.clasHeader}>
          <h1 style={s.clasTitle}>
            {spareggio ? '⚔️ Spareggio' : 'Classifica Finale'}
          </h1>
          <p style={s.clasSub}>Sposi 70% · Pubblico 30%</p>
          {pareggi.length > 0 && !spareggio && (
            <div style={s.pareggioAlert}>
              ⚠️ Pareggio tra Tavolo {fotePareggiate.map(f => f.tavolo).join(' e Tavolo ')}
            </div>
          )}
        </div>

        {/* MODALITÀ SPAREGGIO */}
        {spareggio ? (
          <div style={s.spareggioWrap}>
            <p style={s.spareggioSub}>Gli sposi scelgono il vincitore</p>
            <div style={s.spareggioGrid}>
              {fotePareggiate.map(f => (
                <div key={f.id} style={s.spareggioCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.public_url} alt={f.titolo} style={s.spareggioImg} />
                  <div style={s.spareggioInfo}>
                    <div style={s.spareggioTavolo}>Tavolo {f.tavolo}</div>
                    <div style={s.spareggioTitolo}>{f.titolo}</div>
                    <div style={s.spareggioScore}>{f.punteggio_finale?.toFixed(2)}</div>
                  </div>
                  <button style={s.spareggioBtn} onClick={() => scegliVincitore(f.id)}>
                    🏆 Vince questo
                  </button>
                </div>
              ))}
            </div>
            <button style={{ ...s.backBtn, marginTop: 24 }} onClick={() => setSpareggio(false)}>
              ← Annulla
            </button>
          </div>
        ) : (
          <>
            <div style={s.clasList}>
              {classifica.map((f, i) => {
                const isPareggiatoTop = fotePareggiate.some(fp => fp.id === f.id)
                const isVincitore = f.id === vincitoreId
                return (
                  <div key={f.id} style={{
                    ...s.clasRow,
                    ...(i === 0 && !isPareggiatoTop ? s.clasRow1 : {}),
                    ...(i === 0 && isPareggiatoTop && !vincitoreId ? s.clasRowPari : {}),
                    ...(isVincitore ? s.clasRow1 : {}),
                    ...(i === 1 && !isPareggiatoTop ? s.clasRow2 : {}),
                    ...(i === 2 && !isPareggiatoTop ? s.clasRow3 : {}),
                  }}>
                    <div style={s.clasPos}>
                      {isVincitore ? '🏆' : i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </div>
                    <div style={s.clasThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.public_url} alt={f.titolo} style={s.clasImg} />
                    </div>
                    <div style={s.clasInfo}>
                      <div style={s.clasTavolo}>Tavolo {f.tavolo}</div>
                      <div style={s.clasTitolo}>{f.titolo}</div>
                    </div>
                    <div style={s.clasScores}>
                      <div style={s.clasScore}>
                        <span style={s.clasScoreLabel}>Sposi</span>
                        <span style={s.clasScoreVal}>{f.voto_sposi?.toFixed(1) ?? '—'}</span>
                      </div>
                      <div style={s.clasScore}>
                        <span style={s.clasScoreLabel}>Pubblico</span>
                        <span style={s.clasScoreVal}>{f.voto_pubblico?.toFixed(1) ?? '—'}</span>
                      </div>
                      <div style={{ ...s.clasScore, ...s.clasScoreFinale }}>
                        <span style={s.clasScoreLabel}>Totale</span>
                        <span style={s.clasScoreValBig}>{f.punteggio_finale?.toFixed(2) ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {fotos.filter(f => f.punteggio_finale === null).map(f => (
                <div key={f.id} style={{ ...s.clasRow, opacity: 0.4 }}>
                  <div style={s.clasPos}>—</div>
                  <div style={s.clasThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.public_url} alt={f.titolo} style={s.clasImg} />
                  </div>
                  <div style={s.clasInfo}>
                    <div style={s.clasTavolo}>Tavolo {f.tavolo}</div>
                    <div style={s.clasTitolo}>{f.titolo}</div>
                  </div>
                  <div style={s.clasScores}>
                    <div style={s.clasScore}><span style={s.clasScoreLabel}>Non votata</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.clasFooter}>
              {pareggi.length > 0 && (
                <button style={s.spareggioTriggerBtn} onClick={() => setSpareggio(true)}>
                  ⚔️ Avvia Spareggio
                </button>
              )}
              <button style={s.backBtn} onClick={() => { setFase('slideshow'); setCurrentIdx(fotos.length - 1) }}>
                ← Torna al voto
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // SLIDESHOW
  return (
    <div style={s.slide}>
      {/* Foto principale */}
      <div style={s.slideMain}>
        {foto && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.public_url} alt={foto.titolo} style={s.slideImg} />
            <div style={s.slideOverlay}>
              <div style={s.slideNum}>
                {currentIdx + 1} / {fotos.length}
              </div>
              <div style={s.slideTavoloWrap}>
                <div style={s.slideTavolo}>Tavolo {foto.tavolo}</div>
                <div style={s.slideTitolo}>{foto.titolo}</div>
                <div style={s.slideAutore}>{foto.nome_persona}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pannello destra */}
      <div style={s.slidePanel}>

        {/* Voto sposi */}
        <div style={s.panelSection}>
          <div style={s.panelLabel}>Voto degli Sposi</div>
          {hasVotoSposi ? (
            <div style={s.votoRegistrato}>
              <div style={s.votoNum}>{fotaVotata?.voto_sposi?.toFixed(1)}</div>
              <div style={s.votoRegistratoLabel}>registrato</div>
              <button style={s.cambiaBtn} onClick={() => setSending(false)}>modifica</button>
            </div>
          ) : (
            <>
              <div style={s.votoGrande}>{votoCorrente}<span style={s.votoPicolo}>/10</span></div>
              <div style={s.numRow}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} style={{ ...s.numBtnP, ...(votoCorrente === n ? s.numBtnPActive : {}) }} onClick={() => setVotoCorrente(n)}>{n}</button>
                ))}
              </div>
              <div style={s.numRow}>
                {[6,7,8,9,10].map(n => (
                  <button key={n} style={{ ...s.numBtnP, ...(votoCorrente === n ? s.numBtnPActive : {}) }} onClick={() => setVotoCorrente(n)}>{n}</button>
                ))}
              </div>
              <button style={s.votaBtn} onClick={votaSposi} disabled={sending}>
                {sending ? '...' : 'Conferma voto'}
              </button>
            </>
          )}
          {msg && <div style={s.msgOk}>{msg}</div>}
        </div>

        {/* Voti pubblico */}
        <div style={{padding:'8px 20px', borderBottom:'1px solid rgba(196,164,110,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontSize:9, letterSpacing:3, textTransform:'uppercase' as const, color:'#9b8860', fontFamily:'Jost, sans-serif'}}>Voti pubblico</span>
          <span style={{fontSize:18, fontFamily:'Cormorant Garamond, serif', color:'#8b6914'}}>{foto?.n_voti_pubblico ?? 0}</span>
        </div>

        {/* Mini classifica */}
        <div style={{ ...s.panelSection, flex: 1 }}>
          <div style={s.panelLabel}>Classifica parziale</div>
          <div style={s.miniClass}>
            {classifica.slice(0, 5).map((f, i) => (
              <div key={f.id} style={s.miniRow}>
                <span style={s.miniPos}>{i + 1}</span>
                <span style={s.miniTavolo}>T.{f.tavolo}</span>
                <div style={s.miniBar}>
                  <div style={{ ...s.miniBarFill, width: `${((f.punteggio_finale ?? 0) / 10) * 100}%` }} />
                </div>
                <span style={s.miniScore}>{f.punteggio_finale?.toFixed(1)}</span>
              </div>
            ))}
            {classifica.length === 0 && (
              <div style={s.miniEmpty}>Nessun voto ancora</div>
            )}
          </div>
        </div>

        {/* Navigazione */}
        <div style={s.navRow}>
          <button style={{ ...s.navBtn, ...(currentIdx === 0 ? s.navBtnDisabled : {}) }} onClick={goPrev} disabled={currentIdx === 0}>
            ← Indietro
          </button>
          <button style={s.navBtnNext} onClick={goNext}>
            {currentIdx === fotos.length - 1 ? 'Classifica →' : 'Avanti →'}
          </button>
        </div>
        {/* Aggiorna foto + Reset */}
        <div style={{display:'flex', gap:4, padding:'4px 12px 8px', borderTop:'1px solid rgba(196,164,110,0.1)'}}>
          <button style={s.navBtnSmall} onClick={loadVoti} title="Ricarica foto aggiornate">
            ↻ Aggiorna foto
          </button>
          {!confirmReset ? (
            <button style={s.navBtnDanger} onClick={() => setConfirmReset(true)}>
              ✕ Interrompi
            </button>
          ) : (
            <button style={s.navBtnDangerConfirm} onClick={handleReset} disabled={resetting}>
              {resetting ? '...' : 'Conferma reset'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  loadScreen: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf7f2', fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#9b8860', letterSpacing: 2 },

  startScreen: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1208 0%, #2c2416 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost, sans-serif' },
  startInner: { textAlign: 'center', padding: 40 },
  startTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: '#faf7f2', letterSpacing: 3, marginBottom: 8 },
  startSub: { fontSize: 13, letterSpacing: 4, color: '#c4a46e', textTransform: 'uppercase', marginBottom: 48 },
  startBtn: { padding: '18px 48px', background: '#c4a46e', color: '#1a1208', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500 },

  // Slideshow layout
  slide: { display: 'flex', height: '100vh', background: '#1a1208', overflow: 'hidden' },
  slideMain: { flex: 1, position: 'relative', overflow: 'hidden' },
  slideImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  slideOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,18,8,0.85) 0%, transparent 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 },
  slideNum: { alignSelf: 'flex-start', background: 'rgba(26,18,8,0.6)', color: '#c4a46e', padding: '6px 16px', fontSize: 13, letterSpacing: 3, fontFamily: 'Jost, sans-serif' },
  slideTavoloWrap: { },
  slideTavolo: { fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: '#c4a46e', letterSpacing: 4, lineHeight: 1 },
  slideTitolo: { fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#faf7f2', marginTop: 4 },
  slideAutore: { fontSize: 13, color: 'rgba(250,247,242,0.6)', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' },

  // Pannello destra
  slidePanel: { width: 300, background: '#faf7f2', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid rgba(196,164,110,0.2)' },
  panelSection: { padding: '16px 20px', borderBottom: '1px solid rgba(196,164,110,0.2)' },
  panelLabel: { fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#9b8860', marginBottom: 12, fontFamily: 'Jost, sans-serif' },

  qr: { width: 120, height: 120, display: 'block', margin: '0 auto' },
  qrPlaceholder: { width: 120, height: 120, background: 'rgba(196,164,110,0.1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9b8860' },
  qrSub: { textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9b8860', letterSpacing: 1 },

  votoGrande: { textAlign: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 56, fontWeight: 300, color: '#1a1208', lineHeight: 1, marginBottom: 12 },
  votoPicolo: { fontSize: 24, color: '#c4a46e' },
  numRow: { display: 'flex', gap: 4, marginBottom: 4 },
  numBtnP: { flex: 1, padding: '8px 0', background: 'white', border: '1px solid rgba(196,164,110,0.3)', fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#9b8860', cursor: 'pointer', borderRadius: 0 },
  numBtnPActive: { background: '#1a1208', color: '#c4a46e', border: '1px solid #1a1208' },
  votaBtn: { width: '100%', marginTop: 10, padding: '11px', background: '#1a1208', color: '#c4a46e', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 },
  votoRegistrato: { textAlign: 'center' },
  votoNum: { fontFamily: 'Cormorant Garamond, serif', fontSize: 48, color: '#8b6914' },
  votoRegistratoLabel: { fontSize: 10, letterSpacing: 2, color: '#9b8860', textTransform: 'uppercase' },
  cambiaBtn: { display: 'block', margin: '6px auto 0', background: 'none', border: '1px solid rgba(196,164,110,0.4)', padding: '4px 12px', fontSize: 10, letterSpacing: 2, color: '#9b8860', cursor: 'pointer', textTransform: 'uppercase' },
  msgOk: { marginTop: 8, padding: '6px 10px', background: 'rgba(139,105,20,0.08)', borderLeft: '2px solid #c4a46e', fontSize: 11, color: '#6b4f0a' },

  miniClass: { display: 'flex', flexDirection: 'column', gap: 8 },
  miniRow: { display: 'flex', alignItems: 'center', gap: 8 },
  miniPos: { width: 16, fontSize: 12, color: '#c4a46e', fontWeight: 500, textAlign: 'center', flexShrink: 0 },
  miniTavolo: { fontSize: 11, color: '#9b8860', width: 24, flexShrink: 0, letterSpacing: 0.5 },
  miniBar: { flex: 1, height: 4, background: 'rgba(196,164,110,0.15)', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', background: 'linear-gradient(90deg, #c4a46e, #8b6914)', borderRadius: 2, transition: 'width 0.5s ease' },
  miniScore: { fontSize: 12, color: '#1a1208', fontWeight: 500, width: 28, textAlign: 'right', flexShrink: 0 },
  miniEmpty: { fontSize: 11, color: '#c4b898', letterSpacing: 1, textAlign: 'center', padding: '8px 0' },

  navRow: { padding: '12px 16px', display: 'flex', gap: 8, borderTop: '1px solid rgba(196,164,110,0.2)', background: '#faf7f2' },
  navBtn: { flex: 1, padding: '10px', background: 'white', border: '1px solid rgba(196,164,110,0.3)', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: 2, color: '#9b8860', cursor: 'pointer', borderRadius: 0 },
  navBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  navBtnNext: { flex: 1, padding: '10px', background: '#1a1208', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: 2, color: '#c4a46e', cursor: 'pointer', borderRadius: 0 },

  // Classifica finale
  clasScreen: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'Jost, sans-serif', display: 'flex', flexDirection: 'column' },
  clasHeader: { background: '#1a1208', padding: '32px 48px 24px', textAlign: 'center' },
  clasTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: '#faf7f2', letterSpacing: 3 },
  clasSub: { fontSize: 11, letterSpacing: 3, color: '#c4a46e', textTransform: 'uppercase', marginTop: 8 },
  pareggioAlert: { marginTop: 16, display: 'inline-block', padding: '8px 20px', background: 'rgba(196,164,110,0.2)', border: '1px solid #c4a46e', color: '#c4a46e', fontSize: 13, letterSpacing: 1 },
  clasList: { flex: 1, padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' },
  clasRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: 'white', border: '1px solid rgba(196,164,110,0.2)' },
  clasRow1: { border: '2px solid #c4a46e', background: 'rgba(196,164,110,0.06)' },
  clasRow2: { border: '1px solid rgba(196,164,110,0.4)' },
  clasRow3: { border: '1px solid rgba(196,164,110,0.25)' },
  clasPos: { fontSize: 24, width: 40, textAlign: 'center', flexShrink: 0 },
  clasThumb: { width: 80, height: 60, overflow: 'hidden', flexShrink: 0 },
  clasImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  clasInfo: { flex: 1 },
  clasTavolo: { fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1a1208' },
  clasTitolo: { fontSize: 12, color: '#9b8860', letterSpacing: 1 },
  clasScores: { display: 'flex', gap: 24, alignItems: 'center' },
  clasScore: { textAlign: 'center' },
  clasScoreFinale: { borderLeft: '1px solid rgba(196,164,110,0.3)', paddingLeft: 20 },
  clasScoreLabel: { display: 'block', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#9b8860', marginBottom: 2 },
  clasScoreVal: { fontSize: 20, color: '#1a1208', fontFamily: 'Cormorant Garamond, serif' },
  clasScoreValBig: { fontSize: 28, color: '#8b6914', fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 },
  clasFooter: { padding: '16px 48px', borderTop: '1px solid rgba(196,164,110,0.2)', display: 'flex', justifyContent: 'flex-end' },
  backBtn: { padding: '10px 24px', background: '#1a1208', color: '#c4a46e', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer' },
  clasRowPari: { border: '2px dashed #c4a46e', background: 'rgba(196,164,110,0.04)' },
  spareggioWrap: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px 48px', overflow: 'auto' },
  spareggioSub: { fontSize: 13, letterSpacing: 3, color: '#9b8860', textTransform: 'uppercase' as const, marginBottom: 32 },
  spareggioGrid: { display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' as const, width: '100%', maxWidth: 900 },
  spareggioCard: { flex: 1, minWidth: 280, maxWidth: 400, background: 'white', border: '1px solid rgba(196,164,110,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  spareggioImg: { width: '100%', height: 280, objectFit: 'cover' as const, display: 'block' },
  spareggioInfo: { padding: '16px 20px' },
  spareggioTavolo: { fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#1a1208', fontWeight: 300 },
  spareggioTitolo: { fontSize: 13, color: '#9b8860', letterSpacing: 1, marginTop: 4 },
  spareggioScore: { fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#c4a46e', marginTop: 8 },
  spareggioBtn: { margin: '0 20px 20px', padding: '16px', background: '#1a1208', color: '#c4a46e', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'background 0.2s' },
  spareggioTriggerBtn: { padding: '10px 28px', background: '#c4a46e', color: '#1a1208', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' as const, cursor: 'pointer', marginRight: 12, fontWeight: 500 },
  navBtnSmall: { flex: 1, padding: '7px 0', background: 'white', border: '1px solid rgba(196,164,110,0.3)', fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: 1.5, color: '#9b8860', cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' as const },
  navBtnDanger: { flex: 1, padding: '7px 0', background: 'white', border: '1px solid rgba(160,60,50,0.3)', fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: 1.5, color: '#a03c32', cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' as const },
  navBtnDangerConfirm: { flex: 1, padding: '7px 0', background: '#a03c32', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: 1.5, color: 'white', cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' as const },
}