'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

type Msg = { type: 'success' | 'error'; text: string } | null

export default function ContestFotoAdmin() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [perTavolo, setPerTavolo] = useState<Record<number, Foto[]>>({})
  const [totFoto, setTotFoto] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openTavoli, setOpenTavoli] = useState<Set<number>>(new Set([1,2,3,4,5,6,7,8,9]))
  const [msg, setMsg] = useState<Msg>(null)
  const [renaming, setRenaming] = useState<Foto | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameName, setRenameName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [lightbox, setLightbox] = useState<Foto | null>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setChecking(false); return }
      const { data: profilo } = await supabase.from('profili').select('admin').eq('id', session.user.id).single()
      if (profilo?.admin) {
        setIsAdmin(true)
        setToken(session.access_token)
      }
      setChecking(false)
    })
  }, [])

  const loadFotos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await fetch('/api/contest-foto/admin', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setFotos(data.fotos)
      setPerTavolo(data.perTavolo)
      setTotFoto(data.totFoto)
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Errore', 'error')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadFotos()
  }, [token, loadFotos])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function selectAllTavolo(tavolo: number) {
    const ids = perTavolo[tavolo]?.map(f => f.id) ?? []
    setSelected(prev => {
      const n = new Set(prev)
      const allSelected = ids.every(id => n.has(id))
      ids.forEach(id => allSelected ? n.delete(id) : n.add(id))
      return n
    })
  }

  function selectAll() {
    if (selected.size === fotos.length) setSelected(new Set())
    else setSelected(new Set(fotos.map(f => f.id)))
  }

  function toggleTavolo(t: number) {
    setOpenTavoli(prev => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
  }

  async function handleDelete() {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      const r = await fetch('/api/contest-foto/admin', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      showMsg(`${data.deleted} foto eliminate`, 'success')
      // Aggiorna stato locale immediatamente
      const deletedIds = Array.from(selected)
      setFotos(prev => prev.filter(f => !deletedIds.includes(f.id)))
      setPerTavolo(prev => {
        const updated = { ...prev }
        for (const t in updated) {
          updated[Number(t)] = updated[Number(t)].filter(f => !deletedIds.includes(f.id))
        }
        return updated
      })
      setTotFoto(prev => prev - deletedIds.length)
      setSelected(new Set())
      setConfirmDel(false)
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Errore', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRename() {
    if (!renaming) return
    try {
      const r = await fetch('/api/contest-foto/admin', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renaming.id, titolo: renameTitle, nome_persona: renameName })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      showMsg('Rinominata!', 'success')
      setRenaming(null)
      loadFotos()
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Errore', 'error')
    }
  }

  async function handleDownload() {
    const toDownload = fotos.filter(f => selected.has(f.id))
    for (const f of toDownload) {
      const a = document.createElement('a')
      a.href = f.public_url
      a.download = f.file_path.split('/').pop() ?? 'foto.jpg'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      await new Promise(r => setTimeout(r, 200))
    }
    showMsg(`Download avviato per ${toDownload.length} foto`, 'success')
  }

  // Stima spazio: conta byte approssimativi basandosi sul numero foto (media 2MB)
  const spazioMB = Math.round(totFoto * 2)
  const spazioPerc = Math.min((spazioMB / 1024) * 100, 100)

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#9b8860', fontSize: 14, letterSpacing: 2 }}>
      VERIFICA ACCESSO...
    </div>
  )

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'Georgia, serif' }}>
      <div style={{ fontSize: 32 }}>🔒</div>
      <div style={{ color: '#7a2e25', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase' }}>Accesso non autorizzato</div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .adm { min-height: 100vh; background: #faf7f2; font-family: 'Jost', sans-serif; color: #2c2416; padding-bottom: 60px; }
        .adm-header { background: #1a1208; color: #c4a46e; padding: 20px 20px 16px; }
        .adm-header h1 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; letter-spacing: 2px; }
        .adm-header p { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8b6914; margin-top: 4px; }
        .adm-body { max-width: 700px; margin: 0 auto; padding: 20px 16px; }

        .adm-alert { padding: 12px 16px; margin-bottom: 16px; font-size: 13px; border-left: 2px solid; }
        .adm-alert.success { background: rgba(139,105,20,0.06); border-color: #c4a46e; color: #6b4f0a; }
        .adm-alert.error { background: rgba(160,60,50,0.06); border-color: #a03c32; color: #7a2e25; }

        /* Storage bar */
        .adm-storage { background: white; border: 1px solid rgba(196,164,110,0.3); padding: 16px 20px; margin-bottom: 20px; }
        .adm-storage-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #9b8860; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .adm-storage-bar { height: 4px; background: rgba(196,164,110,0.2); position: relative; }
        .adm-storage-fill { height: 100%; background: #c4a46e; transition: width 0.5s ease; }
        .adm-storage-info { margin-top: 8px; font-size: 12px; color: #9b8860; display: flex; justify-content: space-between; }

        /* Toolbar */
        .adm-toolbar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .adm-btn { padding: 9px 16px; font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: all 0.2s; }
        .adm-btn.primary { background: #1a1208; color: #c4a46e; border-color: #1a1208; }
        .adm-btn.primary:hover { background: #2c2416; }
        .adm-btn.danger { background: white; color: #a03c32; border-color: rgba(160,60,50,0.4); }
        .adm-btn.danger:hover { background: rgba(160,60,50,0.06); }
        .adm-btn.ghost { background: white; color: #9b8860; border-color: rgba(196,164,110,0.3); }
        .adm-btn.ghost:hover { border-color: #c4a46e; color: #2c2416; }
        .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-sel-count { font-size: 11px; letter-spacing: 1px; color: #9b8860; margin-left: auto; }

        /* Confirm bar */
        .adm-confirm { background: rgba(160,60,50,0.06); border: 1px solid rgba(160,60,50,0.3); padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .adm-confirm p { font-size: 13px; color: #7a2e25; flex: 1; }

        /* Tavolo section */
        .adm-tavolo { background: white; border: 1px solid rgba(196,164,110,0.25); margin-bottom: 12px; overflow: hidden; }
        .adm-tavolo-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; user-select: none; }
        .adm-tavolo-header:hover { background: rgba(196,164,110,0.04); }
        .adm-tavolo-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: #1a1208; flex: 1; }
        .adm-tavolo-count { font-size: 11px; letter-spacing: 2px; color: #9b8860; text-transform: uppercase; }
        .adm-tavolo-arrow { color: #c4a46e; font-size: 12px; transition: transform 0.2s; }
        .adm-tavolo-arrow.open { transform: rotate(90deg); }
        .adm-tavolo-selall { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #9b8860; background: none; border: 1px solid rgba(196,164,110,0.3); padding: 4px 10px; cursor: pointer; }
        .adm-tavolo-selall:hover { border-color: #c4a46e; color: #2c2416; }

        /* Photo grid */
        .adm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(196,164,110,0.15); }
        .adm-photo { position: relative; aspect-ratio: 1; overflow: hidden; cursor: pointer; }
        .adm-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.2s; }
        .adm-photo.sel img { opacity: 0.7; }
        .adm-photo-overlay { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: flex-end; padding: 6px; }
        .adm-check { width: 22px; height: 22px; border: 2px solid white; border-radius: 50%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .adm-check.checked { background: #c4a46e; border-color: #c4a46e; }
        .adm-check svg { display: none; }
        .adm-check.checked svg { display: block; }
        .adm-photo-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px; background: linear-gradient(transparent, rgba(26,18,8,0.75)); }
        .adm-photo-name { font-size: 11px; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .adm-photo-sub { font-size: 10px; color: rgba(255,255,255,0.6); }
        .adm-ufficiale { position: absolute; top: 6px; left: 6px; background: #c4a46e; color: white; font-size: 9px; letter-spacing: 1px; padding: 2px 6px; }
        .adm-actions { position: absolute; bottom: 6px; right: 6px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
        .adm-photo:hover .adm-actions { opacity: 1; }
        .adm-action-btn { width: 28px; height: 28px; background: rgba(250,247,242,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; }

        /* Rename modal */
        .adm-modal-bg { position: fixed; inset: 0; background: rgba(26,18,8,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .adm-modal { background: #faf7f2; border: 1px solid rgba(196,164,110,0.4); padding: 24px; width: 100%; max-width: 400px; }
        .adm-modal h2 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; margin-bottom: 20px; color: #1a1208; }
        .adm-modal label { display: block; font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #9b8860; margin-bottom: 6px; margin-top: 14px; }
        .adm-modal input { width: 100%; padding: 10px 14px; border: 1px solid rgba(196,164,110,0.35); background: white; font-family: 'Jost', sans-serif; font-size: 15px; color: #2c2416; outline: none; }
        .adm-modal input:focus { border-color: #c4a46e; }
        .adm-modal-actions { display: flex; gap: 8px; margin-top: 20px; }

        /* Lightbox */
        .adm-lightbox { position: fixed; inset: 0; background: rgba(26,18,8,0.92); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .adm-lightbox img { max-width: 100%; max-height: 80vh; object-fit: contain; }
        .adm-lightbox-info { position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; color: rgba(196,164,110,0.9); font-size: 13px; letter-spacing: 1px; }
        .adm-lightbox-close { position: absolute; top: 20px; right: 20px; color: #c4a46e; font-size: 24px; cursor: pointer; background: none; border: none; }
      `}</style>

      <div className="adm">
        <header className="adm-header">
          <h1>Admin Contest Fotografico</h1>
          <p>Yas ♥ Pera · Matrimonio 2025</p>
        </header>

        <div className="adm-body">
          {msg && <div className={`adm-alert ${msg.type}`}>{msg.text}</div>}

          {/* Storage */}
          <div className="adm-storage">
            <div className="adm-storage-label">
              <span>Spazio Supabase Storage</span>
              <span>{totFoto} foto totali</span>
            </div>
            <div className="adm-storage-bar">
              <div className="adm-storage-fill" style={{ width: `${spazioPerc}%` }} />
            </div>
            <div className="adm-storage-info">
              <span>~{spazioMB}MB usati (stima)</span>
              <span>1024MB disponibili</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="adm-toolbar">
            <button className="adm-btn ghost" onClick={selectAll}>
              {selected.size === fotos.length && fotos.length > 0 ? 'Deseleziona tutto' : 'Seleziona tutto'}
            </button>
            <button className="adm-btn ghost" onClick={loadFotos} disabled={loading}>
              {loading ? '...' : '↻ Aggiorna'}
            </button>
            {selected.size > 0 && (
              <>
                <button className="adm-btn primary" onClick={handleDownload}>
                  ↓ Scarica ({selected.size})
                </button>
                <button className="adm-btn danger" onClick={() => setConfirmDel(true)}>
                  ✕ Elimina ({selected.size})
                </button>
              </>
            )}
            {selected.size > 0 && (
              <span className="adm-sel-count">{selected.size} selezionate</span>
            )}
          </div>

          {/* Confirm delete */}
          {confirmDel && (
            <div className="adm-confirm">
              <p>Eliminare {selected.size} foto? L&apos;operazione è irreversibile.</p>
              <button className="adm-btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminazione...' : 'Conferma'}
              </button>
              <button className="adm-btn ghost" onClick={() => setConfirmDel(false)}>Annulla</button>
            </div>
          )}

          {/* Per tavolo */}
          {Array.from({ length: 9 }, (_, i) => i + 1).map(t => {
            const fotosTavolo = perTavolo[t] ?? []
            const isOpen = openTavoli.has(t)
            const allSel = fotosTavolo.length > 0 && fotosTavolo.every(f => selected.has(f.id))

            return (
              <div key={t} className="adm-tavolo">
                <div className="adm-tavolo-header" onClick={() => toggleTavolo(t)}>
                  <span className={`adm-tavolo-arrow ${isOpen ? 'open' : ''}`}>▶</span>
                  <span className="adm-tavolo-title">Tavolo {t}</span>
                  <span className="adm-tavolo-count">{fotosTavolo.length} foto</span>
                  {fotosTavolo.length > 0 && (
                    <button
                      className="adm-tavolo-selall"
                      onClick={e => { e.stopPropagation(); selectAllTavolo(t) }}
                    >
                      {allSel ? 'Deseleziona' : 'Seleziona tutto'}
                    </button>
                  )}
                </div>

                {isOpen && fotosTavolo.length > 0 && (
                  <div className="adm-grid">
                    {fotosTavolo.map(f => (
                      <div
                        key={f.id}
                        className={`adm-photo ${selected.has(f.id) ? 'sel' : ''}`}
                        onClick={() => toggleSelect(f.id)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.public_url} alt={f.titolo} loading="lazy" />
                        {f.is_ufficiale && <div className="adm-ufficiale">✦ UFFICIALE</div>}
                        <div className="adm-photo-overlay">
                          <div className={`adm-check ${selected.has(f.id) ? 'checked' : ''}`}>
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                              <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </div>
                        <div className="adm-photo-info">
                          <div className="adm-photo-name">{f.titolo}</div>
                          <div className="adm-photo-sub">{f.nome_persona}</div>
                        </div>
                        <div className="adm-actions">
                          <button
                            className="adm-action-btn"
                            title="Visualizza"
                            onClick={e => { e.stopPropagation(); setLightbox(f) }}
                          >👁</button>
                          <button
                            className="adm-action-btn"
                            title="Rinomina"
                            onClick={e => { e.stopPropagation(); setRenaming(f); setRenameTitle(f.titolo); setRenameName(f.nome_persona) }}
                          >✎</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && fotosTavolo.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, letterSpacing: 2, color: '#c4b898', textTransform: 'uppercase' }}>
                    Nessuna foto
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rename modal */}
      {renaming && (
        <div className="adm-modal-bg" onClick={() => setRenaming(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <h2>Modifica foto</h2>
            <label>Titolo</label>
            <input value={renameTitle} onChange={e => setRenameTitle(e.target.value)} />
            <label>Nome persona</label>
            <input value={renameName} onChange={e => setRenameName(e.target.value)} />
            <div className="adm-modal-actions">
              <button className="adm-btn primary" onClick={handleRename} style={{ flex: 1 }}>Salva</button>
              <button className="adm-btn ghost" onClick={() => setRenaming(null)} style={{ flex: 1 }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="adm-lightbox" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.public_url} alt={lightbox.titolo} onClick={e => e.stopPropagation()} />
          <button className="adm-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          <div className="adm-lightbox-info">
            {lightbox.titolo} · {lightbox.nome_persona} · Tavolo {lightbox.tavolo}
          </div>
        </div>
      )}
    </>
  )
}