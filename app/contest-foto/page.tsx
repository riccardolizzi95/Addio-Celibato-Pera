'use client'

import { useState, useEffect, useRef } from 'react'

const TAVOLI = Array.from({ length: 9 }, (_, i) => i + 1)

interface Foto {
  id: string
  tavolo: number
  nome_persona: string
  titolo: string
  file_path: string
  is_ufficiale: boolean
  public_url: string
}

type Msg = { type: 'success' | 'error' | 'warning'; text: string } | null

export default function ContestFotoPage() {
  const [tavolo, setTavolo] = useState('')
  const [tavoloFromQR, setTavoloFromQR] = useState('')
  const [nomePersona, setNomePersona] = useState('')
  const [titolo, setTitolo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  const [fotoEsistente, setFotoEsistente] = useState<Foto | null>(null)
  const [loadingCheck, setLoadingCheck] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Leggi tavolo dal QR
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tavolo')
    if (t && parseInt(t) >= 1 && parseInt(t) <= 9) {
      setTavolo(t)
      setTavoloFromQR(t)
      checkFotoEsistente(t)
    }
  }, [])

  // Controlla se esiste già una foto per il tavolo
  async function checkFotoEsistente(t: string) {
    setLoadingCheck(true)
    try {
      const r = await fetch(`/api/contest-foto/foto?tavolo=${t}`)
      const data = await r.json()
      if (r.ok && data.foto?.length > 0) {
        // Trova la foto ufficiale o l'ultima caricata
        const ufficiale = data.foto.find((f: Foto) => f.is_ufficiale) || data.foto[0]
        setFotoEsistente(ufficiale)
      } else {
        setFotoEsistente(null)
      }
    } catch {
      setFotoEsistente(null)
    } finally {
      setLoadingCheck(false)
    }
  }

  function handleTavoloChange(t: string) {
    setTavolo(t)
    setFotoEsistente(null)
    setConfirmOverwrite(false)
    setMsg(null)
    if (t) checkFotoEsistente(t)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setMsg(null)
  }

  async function doUpload() {
    if (!tavolo || !nomePersona || !titolo || !file) {
      setMsg({ type: 'error', text: 'Compila tutti i campi e seleziona una foto.' })
      return
    }
    setLoading(true)
    setMsg(null)
    setConfirmOverwrite(false)

    // Se esiste già una foto, prima eliminiamo tutte quelle del tavolo
    if (fotoEsistente) {
      await fetch('/api/contest-foto/delete-tavolo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tavolo: parseInt(tavolo) })
      })
    }

    const fd = new FormData()
    fd.append('tavolo', tavolo)
    fd.append('nome_persona', nomePersona)
    fd.append('titolo', titolo)
    fd.append('foto', file)

    try {
      const r = await fetch('/api/contest-foto/upload', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)

      // Imposta come ufficiale
      await fetch('/api/contest-foto/set-ufficiale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_id: data.foto.id, tavolo: parseInt(tavolo) })
      })

      setMsg({ type: 'success', text: 'La vostra foto è stata caricata con successo! ✨' })
      setFotoEsistente({ ...data.foto, public_url: data.foto.public_url || preview || '' })
      setFile(null)
      setPreview(null)
      setTitolo('')
      setNomePersona('')
      if (fileRef.current) fileRef.current.value = ''
      checkFotoEsistente(tavolo)
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Errore durante il caricamento.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fotoEsistente && !confirmOverwrite) {
      setConfirmOverwrite(true)
      return
    }
    doUpload()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cf { min-height: 100vh; background: #faf7f2; font-family: 'Jost', sans-serif; color: #2c2416; }

        /* Header */
        .cf-hero {
          position: relative;
          text-align: center;
          padding: 52px 24px 40px;
          background: linear-gradient(180deg, #f5efe6 0%, #faf7f2 100%);
          border-bottom: 1px solid rgba(196,164,110,0.2);
          overflow: hidden;
        }
        .cf-hero::before, .cf-hero::after {
          content: '';
          position: absolute;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,164,110,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .cf-hero::before { top: -40px; left: -40px; }
        .cf-hero::after { bottom: -40px; right: -40px; }

        .cf-ornament { color: #c4a46e; letter-spacing: 8px; font-size: 13px; margin-bottom: 16px; }
        .cf-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px; font-weight: 300;
          color: #1a1208; line-height: 1.1;
          letter-spacing: 2px;
        }
        .cf-h1 em { font-style: italic; color: #8b6914; }
        .cf-sub {
          font-size: 11px; letter-spacing: 5px; text-transform: uppercase;
          color: #9b8860; margin-top: 10px; font-weight: 300;
        }
        .cf-badge {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 18px; padding: 8px 24px;
          background: #1a1208; color: #c4a46e;
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
        }

        /* Body */
        .cf-body { max-width: 460px; margin: 0 auto; padding: 36px 20px 60px; }

        /* Alert */
        .cf-alert {
          padding: 14px 18px; margin-bottom: 24px;
          font-size: 13px; line-height: 1.6; letter-spacing: 0.2px;
          border-left: 2px solid;
        }
        .cf-alert.success { background: rgba(139,105,20,0.06); border-color: #c4a46e; color: #6b4f0a; }
        .cf-alert.error { background: rgba(160,60,50,0.06); border-color: #a03c32; color: #7a2e25; }
        .cf-alert.warning { background: rgba(196,164,110,0.1); border-color: #c4a46e; color: #5a3e00; }

        /* Foto esistente */
        .cf-existing {
          margin-bottom: 28px;
          border: 1px solid rgba(196,164,110,0.35);
          overflow: hidden;
          background: white;
        }
        .cf-existing-label {
          padding: 10px 16px;
          background: rgba(196,164,110,0.1);
          font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
          color: #8b6914; display: flex; align-items: center; gap: 8px;
        }
        .cf-existing img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .cf-existing-info { padding: 12px 16px; }
        .cf-existing-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: #1a1208; margin-bottom: 3px;
        }
        .cf-existing-meta { font-size: 11px; letter-spacing: 1px; color: #9b8860; text-transform: uppercase; }

        /* Divider */
        .cf-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 28px 0;
        }
        .cf-divider-line { flex: 1; height: 1px; background: rgba(196,164,110,0.3); }
        .cf-divider-text { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #c4a46e; white-space: nowrap; }

        /* Form */
        .cf-field { margin-bottom: 22px; }
        .cf-label {
          display: block; font-size: 10px; letter-spacing: 2.5px;
          text-transform: uppercase; color: #9b8860; margin-bottom: 8px;
        }
        .cf-input, .cf-select {
          width: 100%; padding: 12px 16px;
          background: white; border: 1px solid rgba(196,164,110,0.35);
          font-family: 'Jost', sans-serif; font-size: 15px; color: #2c2416;
          outline: none; transition: border-color 0.2s; -webkit-appearance: none;
        }
        .cf-input:focus, .cf-select:focus { border-color: #c4a46e; }
        .cf-input::placeholder { color: #c4b898; }
        .cf-tavolo-fixed {
          width: 100%; padding: 12px 16px;
          background: rgba(196,164,110,0.06); border: 1px solid rgba(196,164,110,0.35);
          display: flex; align-items: center; justify-content: space-between;
          font-size: 15px; color: #2c2416;
        }
        .cf-tavolo-fixed span.badge {
          font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8b6914;
        }

        /* File upload */
        .cf-upload-area {
          position: relative; border: 1px dashed rgba(196,164,110,0.5);
          background: white; padding: 28px 20px; text-align: center;
          cursor: pointer; transition: background 0.2s;
        }
        .cf-upload-area:hover { background: rgba(196,164,110,0.04); }
        .cf-upload-area input {
          position: absolute; inset: 0; opacity: 0;
          cursor: pointer; width: 100%; height: 100%;
        }
        .cf-upload-icon { font-size: 32px; margin-bottom: 10px; }
        .cf-upload-text { font-size: 12px; letter-spacing: 1px; color: #9b8860; line-height: 1.6; }
        .cf-upload-filename { font-size: 13px; color: #2c2416; margin-top: 4px; font-weight: 500; }

        /* Preview */
        .cf-preview { margin-top: 12px; position: relative; overflow: hidden; }
        .cf-preview img { width: 100%; max-height: 260px; object-fit: cover; display: block; }
        .cf-preview-overlay {
          position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 14px;
          background: linear-gradient(transparent, rgba(26,18,8,0.65));
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.75);
        }

        /* Confirm overwrite */
        .cf-overwrite {
          border: 1px solid rgba(196,164,110,0.5);
          background: rgba(196,164,110,0.08);
          padding: 18px 20px; margin-bottom: 4px;
        }
        .cf-overwrite p {
          font-size: 13px; line-height: 1.6; color: #5a3e00; margin-bottom: 16px;
        }
        .cf-overwrite-actions { display: flex; gap: 10px; }

        /* Buttons */
        .cf-btn {
          width: 100%; padding: 14px; margin-top: 24px;
          background: #1a1208; color: #c4a46e; border: none;
          font-family: 'Jost', sans-serif; font-size: 11px;
          letter-spacing: 4px; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .cf-btn:hover:not(:disabled) { background: #2c2416; }
        .cf-btn:disabled { background: #c4b898; color: #9b8860; cursor: not-allowed; }
        .cf-btn-outline {
          flex: 1; padding: 11px; background: white;
          border: 1px solid rgba(196,164,110,0.4); color: #8b6914;
          font-family: 'Jost', sans-serif; font-size: 10px;
          letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s;
        }
        .cf-btn-outline:hover { border-color: #c4a46e; background: rgba(196,164,110,0.06); }
        .cf-btn-solid {
          flex: 1; padding: 11px; background: #1a1208;
          border: 1px solid #1a1208; color: #c4a46e;
          font-family: 'Jost', sans-serif; font-size: 10px;
          letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
        }

        /* Footer */
        .cf-footer {
          text-align: center; padding-bottom: 32px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px; font-style: italic; color: #c4a46e; letter-spacing: 1px;
        }
      `}</style>

      <div className="cf">
        {/* Hero */}
        <header className="cf-hero">
          <div className="cf-ornament">✦ ✦ ✦</div>
          <h1 className="cf-h1">Contest<br /><em>Fotografico</em></h1>
          <p className="cf-sub">Yas &amp; Pera · Matrimonio 2025</p>
          {tavoloFromQR && (
            <div className="cf-badge">
              <span>✦</span>
              <span>Tavolo {tavoloFromQR}</span>
              <span>✦</span>
            </div>
          )}
        </header>

        <div className="cf-body">

          {/* Alert */}
          {msg && <div className={`cf-alert ${msg.type}`}>{msg.text}</div>}

          {/* Foto esistente */}
          {loadingCheck && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, letterSpacing: 2, color: '#c4a46e', textTransform: 'uppercase' }}>
              Verifica in corso...
            </div>
          )}

          {fotoEsistente && !loadingCheck && (
            <>
              <div className="cf-existing">
                <div className="cf-existing-label">
                  <span>✦</span>
                  <span>Foto attuale del tavolo</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoEsistente.public_url} alt={fotoEsistente.titolo} />
                <div className="cf-existing-info">
                  <div className="cf-existing-title">{fotoEsistente.titolo}</div>
                  <div className="cf-existing-meta">{fotoEsistente.nome_persona}</div>
                </div>
              </div>

              <div className="cf-divider">
                <div className="cf-divider-line" />
                <span className="cf-divider-text">Vuoi sostituirla?</span>
                <div className="cf-divider-line" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Tavolo */}
            <div className="cf-field">
              <label className="cf-label">Numero tavolo</label>
              {tavoloFromQR ? (
                <div className="cf-tavolo-fixed">
                  <span>Tavolo {tavoloFromQR}</span>
                  <span className="badge">✓ dal QR</span>
                </div>
              ) : (
                <select
                  className="cf-select"
                  value={tavolo}
                  onChange={e => handleTavoloChange(e.target.value)}
                  required
                >
                  <option value="">Seleziona tavolo</option>
                  {TAVOLI.map(t => <option key={t} value={t}>Tavolo {t}</option>)}
                </select>
              )}
            </div>

            {/* Nome */}
            <div className="cf-field">
              <label className="cf-label">Il tuo nome</label>
              <input
                className="cf-input" type="text"
                placeholder="Mario Rossi"
                value={nomePersona}
                onChange={e => setNomePersona(e.target.value)}
                required maxLength={50}
              />
            </div>

            {/* Titolo */}
            <div className="cf-field">
              <label className="cf-label">Titolo della foto</label>
              <input
                className="cf-input" type="text"
                placeholder="Il brindisi del tavolo"
                value={titolo}
                onChange={e => setTitolo(e.target.value)}
                required maxLength={80}
              />
            </div>

            {/* Upload */}
            <div className="cf-field">
              <label className="cf-label">
                {fotoEsistente ? 'Nuova foto (sostituirà quella attuale)' : 'Foto'}
              </label>
              <div className="cf-upload-area">
                <input
                  ref={fileRef} type="file" accept="image/*"
                  onChange={handleFileChange} required
                />
                <div className="cf-upload-icon">
                  {file ? '✓' : '🌸'}
                </div>
                <div className="cf-upload-text">
                  {file
                    ? <span className="cf-upload-filename">{file.name}</span>
                    : 'Tocca per scegliere una foto'
                  }
                </div>
              </div>
              {preview && (
                <div className="cf-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Anteprima" />
                  <div className="cf-preview-overlay">Anteprima</div>
                </div>
              )}
            </div>

            {/* Conferma sovrascrittura */}
            {confirmOverwrite && fotoEsistente && (
              <div className="cf-overwrite">
                <p>
                  Il tavolo {tavolo} ha già una foto caricata
                  {fotoEsistente.titolo ? ` — "${fotoEsistente.titolo}"` : ''}.<br />
                  Procedendo, la foto attuale verrà sostituita definitivamente.
                </p>
                <div className="cf-overwrite-actions">
                  <button type="button" className="cf-btn-outline" onClick={() => setConfirmOverwrite(false)}>
                    Annulla
                  </button>
                  <button type="button" className="cf-btn-solid" onClick={doUpload} disabled={loading}>
                    {loading ? 'Caricamento...' : 'Sì, sostituisci'}
                  </button>
                </div>
              </div>
            )}

            {!confirmOverwrite && (
              <button type="submit" className="cf-btn" disabled={loading}>
                {loading
                  ? 'Caricamento in corso...'
                  : fotoEsistente
                    ? 'Sostituisci foto'
                    : 'Carica foto'
                }
              </button>
            )}
          </form>

          {/* Istruzioni */}
          {!fotoEsistente && !loadingCheck && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#b8a882', marginTop: 16, lineHeight: 1.7, letterSpacing: 0.3 }}>
              Ogni tavolo può partecipare con una sola foto.<br />
              Gli sposi voteranno la più bella durante la serata.
            </p>
          )}
        </div>

        <div className="cf-footer">con amore, per sempre</div>
      </div>
    </>
  )
}