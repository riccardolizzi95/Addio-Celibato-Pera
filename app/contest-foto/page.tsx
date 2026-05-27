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
  contatore: number
  created_at: string
  public_url: string
}

type View = 'upload' | 'gallery'
type Msg = { type: 'success' | 'error'; text: string } | null

export default function ContestFotoPage() {
  const [view, setView] = useState<View>('upload')
  const [tavolo, setTavolo] = useState('')
  const [tavoloFromQR, setTavoloFromQR] = useState('')
  const [nomePersona, setNomePersona] = useState('')
  const [titolo, setTitolo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [settingUfficiale, setSettingUfficiale] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tavolo')
    if (t && parseInt(t) >= 1 && parseInt(t) <= 9) {
      setTavolo(t)
      setTavoloFromQR(t)
    }
  }, [])

  useEffect(() => {
    if (view === 'gallery' && tavoloFromQR) loadGallery(tavoloFromQR)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!tavolo || !nomePersona || !titolo || !file) {
      setMsg({ type: 'error', text: 'Compila tutti i campi e seleziona una foto.' })
      return
    }
    setLoading(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('tavolo', tavolo)
    fd.append('nome_persona', nomePersona)
    fd.append('titolo', titolo)
    fd.append('foto', file)
    try {
      const r = await fetch('/api/contest-foto/upload', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: 'Foto caricata con successo! Puoi caricarne altre o scegliere quella ufficiale nella Galleria.' })
      setFile(null); setPreview(null); setTitolo('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Errore' })
    } finally {
      setLoading(false)
    }
  }

  async function loadGallery(t?: string) {
    const tavoloToLoad = t || tavolo
    if (!tavoloToLoad) return
    setLoadingGallery(true)
    setFotos([])
    setMsg(null)
    try {
      const r = await fetch(`/api/contest-foto/foto?tavolo=${tavoloToLoad}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setFotos(data.foto)
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Errore' })
    } finally {
      setLoadingGallery(false)
    }
  }

  async function handleSetUfficiale(fotoId: string) {
    setSettingUfficiale(fotoId)
    setMsg(null)
    try {
      const r = await fetch('/api/contest-foto/set-ufficiale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_id: fotoId, tavolo: parseInt(tavolo) }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: 'Foto ufficiale selezionata! Rappresenterà il vostro tavolo nel contest.' })
      setFotos(prev => prev.map(f => ({ ...f, is_ufficiale: f.id === fotoId })))
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Errore' })
    } finally {
      setSettingUfficiale(null)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cf-page {
          min-height: 100vh;
          background: #faf7f2;
          font-family: 'Jost', sans-serif;
          color: #2c2416;
          position: relative;
          overflow-x: hidden;
        }

        /* Decorative corner flourishes */
        .cf-page::before {
          content: '';
          position: fixed;
          top: 0; left: 0;
          width: 200px; height: 200px;
          background: radial-gradient(ellipse at top left, rgba(196,164,110,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .cf-page::after {
          content: '';
          position: fixed;
          bottom: 0; right: 0;
          width: 200px; height: 200px;
          background: radial-gradient(ellipse at bottom right, rgba(196,164,110,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .cf-header {
          text-align: center;
          padding: 48px 24px 32px;
          position: relative;
        }

        .cf-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin: 16px 0;
        }
        .cf-divider-line {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c4a46e);
        }
        .cf-divider-line.right {
          background: linear-gradient(90deg, #c4a46e, transparent);
        }
        .cf-divider-diamond {
          width: 6px; height: 6px;
          background: #c4a46e;
          transform: rotate(45deg);
        }

        .cf-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 300;
          letter-spacing: 3px;
          color: #1a1208;
          line-height: 1.1;
        }
        .cf-title em {
          font-style: italic;
          color: #8b6914;
        }
        .cf-subtitle {
          font-size: 12px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #9b8860;
          margin-top: 8px;
          font-weight: 300;
        }

        .cf-tavolo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 8px 20px;
          background: #1a1208;
          color: #c4a46e;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 400;
        }

        .cf-tabs {
          display: flex;
          max-width: 480px;
          margin: 0 auto 24px;
          padding: 0 20px;
          gap: 0;
          border-bottom: 1px solid rgba(196,164,110,0.3);
        }
        .cf-tab {
          flex: 1;
          padding: 12px 8px;
          background: none;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #9b8860;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }
        .cf-tab.active {
          color: #1a1208;
          font-weight: 500;
        }
        .cf-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 1px;
          background: #c4a46e;
        }

        .cf-card {
          max-width: 480px;
          margin: 0 auto;
          padding: 0 20px 60px;
        }

        .cf-alert {
          padding: 14px 18px;
          margin-bottom: 20px;
          font-size: 13px;
          letter-spacing: 0.3px;
          line-height: 1.5;
          border-left: 2px solid;
        }
        .cf-alert.success {
          background: rgba(139,105,20,0.06);
          border-color: #c4a46e;
          color: #6b4f0a;
        }
        .cf-alert.error {
          background: rgba(160,60,50,0.06);
          border-color: #a03c32;
          color: #7a2e25;
        }

        .cf-field { margin-bottom: 20px; }
        .cf-label {
          display: block;
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #9b8860;
          margin-bottom: 8px;
          font-weight: 400;
        }
        .cf-input, .cf-select {
          width: 100%;
          padding: 12px 16px;
          background: white;
          border: 1px solid rgba(196,164,110,0.35);
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          color: #2c2416;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .cf-input:focus, .cf-select:focus {
          border-color: #c4a46e;
        }
        .cf-input::placeholder { color: #c4b898; }

        .cf-tavolo-display {
          width: 100%;
          padding: 12px 16px;
          background: rgba(196,164,110,0.08);
          border: 1px solid rgba(196,164,110,0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          color: #2c2416;
        }
        .cf-tavolo-display span.qr-label {
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8b6914;
        }

        .cf-file-area {
          border: 1px dashed rgba(196,164,110,0.5);
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s;
          background: white;
          position: relative;
        }
        .cf-file-area:hover { background: rgba(196,164,110,0.04); }
        .cf-file-area input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .cf-file-area .icon { font-size: 28px; margin-bottom: 8px; }
        .cf-file-area .text {
          font-size: 12px;
          letter-spacing: 1px;
          color: #9b8860;
        }
        .cf-file-area .filename {
          font-size: 13px;
          color: #2c2416;
          margin-top: 4px;
        }

        .cf-preview {
          margin-top: 12px;
          overflow: hidden;
          position: relative;
        }
        .cf-preview img {
          width: 100%;
          max-height: 240px;
          object-fit: cover;
          display: block;
        }
        .cf-preview-label {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 8px 12px;
          background: linear-gradient(transparent, rgba(26,18,8,0.7));
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
        }

        .cf-btn {
          width: 100%;
          padding: 14px;
          background: #1a1208;
          color: #c4a46e;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 24px;
        }
        .cf-btn:hover:not(:disabled) {
          background: #2c2416;
          color: #d4b47e;
        }
        .cf-btn:disabled {
          background: #c4b898;
          color: #9b8860;
          cursor: not-allowed;
        }

        .cf-hint {
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.5px;
          color: #b8a882;
          margin-top: 12px;
          line-height: 1.6;
        }

        /* Gallery */
        .cf-gallery-header {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          align-items: center;
        }
        .cf-gallery-header .cf-select { flex: 1; }
        .cf-load-btn {
          padding: 12px 20px;
          background: #1a1208;
          color: #c4a46e;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }
        .cf-load-btn:disabled {
          background: #c4b898;
          color: #9b8860;
          cursor: not-allowed;
        }

        .cf-photo-grid { display: flex; flex-direction: column; gap: 20px; }

        .cf-photo-card {
          background: white;
          border: 1px solid rgba(196,164,110,0.25);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .cf-photo-card.ufficiale {
          border-color: #c4a46e;
          box-shadow: 0 0 0 1px #c4a46e;
        }
        .cf-photo-card img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
        }
        .cf-photo-info {
          padding: 14px 16px 10px;
        }
        .cf-photo-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          color: #1a1208;
          margin-bottom: 4px;
        }
        .cf-photo-meta {
          font-size: 11px;
          letter-spacing: 1px;
          color: #9b8860;
          text-transform: uppercase;
        }
        .cf-ufficiale-badge {
          margin: 0 16px 16px;
          padding: 9px;
          background: rgba(196,164,110,0.1);
          border: 1px solid rgba(196,164,110,0.4);
          text-align: center;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #8b6914;
        }
        .cf-select-btn {
          margin: 0 16px 16px;
          width: calc(100% - 32px);
          padding: 10px;
          background: none;
          border: 1px solid rgba(196,164,110,0.4);
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #8b6914;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cf-select-btn:hover:not(:disabled) {
          background: rgba(196,164,110,0.08);
          border-color: #c4a46e;
        }
        .cf-select-btn:disabled {
          color: #c4b898;
          cursor: not-allowed;
        }

        .cf-empty {
          text-align: center;
          padding: 40px 0;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #c4b898;
        }

        .cf-footer {
          text-align: center;
          padding: 0 24px 32px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: #c4a46e;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="cf-page">
        {/* Header */}
        <header className="cf-header">
          <div className="cf-divider">
            <div className="cf-divider-line"></div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C10 2 7 6 2 7C2 7 5 12 10 18C15 12 18 7 18 7C13 6 10 2 10 2Z" fill="none" stroke="#c4a46e" strokeWidth="1"/>
            </svg>
            <div className="cf-divider-line right"></div>
          </div>
          <h1 className="cf-title">Contest<br/><em>Fotografico</em></h1>
          <p className="cf-subtitle">Yas &amp; Pera · 30 Maggio 2026</p>
          {tavoloFromQR && (
            <div className="cf-tavolo-badge">
              <span>✦</span>
              <span>Tavolo {tavoloFromQR}</span>
              <span>✦</span>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="cf-tabs">
          <button
            className={`cf-tab ${view === 'upload' ? 'active' : ''}`}
            onClick={() => { setView('upload'); setMsg(null) }}
          >
            Carica foto
          </button>
          <button
            className={`cf-tab ${view === 'gallery' ? 'active' : ''}`}
            onClick={() => { setView('gallery'); setMsg(null) }}
          >
            Galleria &amp; Selezione
          </button>
        </div>

        {/* Content */}
        <div className="cf-card">
          {msg && (
            <div className={`cf-alert ${msg.type}`}>
              {msg.text}
            </div>
          )}

          {/* UPLOAD */}
          {view === 'upload' && (
            <form onSubmit={handleUpload}>
              <div className="cf-field">
                <label className="cf-label">Numero tavolo</label>
                {tavoloFromQR ? (
                  <div className="cf-tavolo-display">
                    <span>Tavolo {tavoloFromQR}</span>
                    <span className="qr-label">✓ dal QR</span>
                  </div>
                ) : (
                  <select
                    className="cf-select"
                    value={tavolo}
                    onChange={e => setTavolo(e.target.value)}
                    required
                  >
                    <option value="">Seleziona tavolo</option>
                    {TAVOLI.map(t => <option key={t} value={t}>Tavolo {t}</option>)}
                  </select>
                )}
              </div>

              <div className="cf-field">
                <label className="cf-label">Il tuo nome</label>
                <input
                  className="cf-input"
                  type="text"
                  placeholder="Mario Rossi"
                  value={nomePersona}
                  onChange={e => setNomePersona(e.target.value)}
                  required maxLength={50}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">Titolo della foto</label>
                <input
                  className="cf-input"
                  type="text"
                  placeholder="Il brindisi del tavolo"
                  value={titolo}
                  onChange={e => setTitolo(e.target.value)}
                  required maxLength={80}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">Seleziona foto</label>
                <div className="cf-file-area">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  <div className="icon">🌸</div>
                  <div className="text">
                    {file ? (
                      <span className="filename">{file.name}</span>
                    ) : (
                      'Tocca per scegliere una foto'
                    )}
                  </div>
                </div>
                {preview && (
                  <div className="cf-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="preview" />
                    <div className="cf-preview-label">Anteprima</div>
                  </div>
                )}
              </div>

              <button type="submit" className="cf-btn" disabled={loading}>
                {loading ? 'Caricamento in corso...' : 'Carica foto'}
              </button>

              <p className="cf-hint">
                Puoi caricare quante foto vuoi.<br />
                Nella Galleria sceglierai quella ufficiale per il contest.
              </p>
            </form>
          )}

          {/* GALLERY */}
          {view === 'gallery' && (
            <div>
              {!tavoloFromQR && (
                <div className="cf-gallery-header">
                  <select
                    className="cf-select"
                    value={tavolo}
                    onChange={e => setTavolo(e.target.value)}
                  >
                    <option value="">Seleziona tavolo</option>
                    {TAVOLI.map(t => <option key={t} value={t}>Tavolo {t}</option>)}
                  </select>
                  <button
                    className="cf-load-btn"
                    onClick={() => loadGallery()}
                    disabled={!tavolo || loadingGallery}
                  >
                    {loadingGallery ? '...' : 'Carica'}
                  </button>
                </div>
              )}

              {loadingGallery && (
                <div className="cf-empty">Caricamento...</div>
              )}

              {fotos.length === 0 && !loadingGallery && tavolo && (
                <div className="cf-empty">Nessuna foto ancora per questo tavolo</div>
              )}

              <div className="cf-photo-grid">
                {fotos.map(f => (
                  <div key={f.id} className={`cf-photo-card ${f.is_ufficiale ? 'ufficiale' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.public_url} alt={f.titolo} loading="lazy" />
                    <div className="cf-photo-info">
                      <div className="cf-photo-title">{f.titolo}</div>
                      <div className="cf-photo-meta">{f.nome_persona} · Tavolo {f.tavolo}</div>
                    </div>
                    {f.is_ufficiale ? (
                      <div className="cf-ufficiale-badge">✦ Foto ufficiale ✦</div>
                    ) : (
                      <button
                        className="cf-select-btn"
                        onClick={() => handleSetUfficiale(f.id)}
                        disabled={settingUfficiale === f.id}
                      >
                        {settingUfficiale === f.id ? 'Salvataggio...' : 'Seleziona come foto ufficiale'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cf-footer">con amore, per sempre</div>
      </div>
    </>
  )
}