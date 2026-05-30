import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Prendi tutte le foto con i loro voti
    const { data: fotos, error: fotosErr } = await supabase
      .from('foto_contest')
      .select('id, tavolo, titolo, nome_persona, file_path, is_ufficiale')
      .order('tavolo')

    if (fotosErr) throw new Error(fotosErr.message)

    const { data: voti, error: votiErr } = await supabase
      .from('voti_contest')
      .select('foto_id, tipo, valore')

    if (votiErr) throw new Error(votiErr.message)

    // Calcola punteggi per ogni foto
    const risultati = fotos.map(f => {
      const votiSposi = voti.filter(v => v.foto_id === f.id && v.tipo === 'sposi')
      const votiPubblico = voti.filter(v => v.foto_id === f.id && v.tipo === 'pubblico')

      const mediaSposi = votiSposi.length > 0
        ? votiSposi.reduce((s, v) => s + v.valore, 0) / votiSposi.length
        : null

      const mediaPubblico = votiPubblico.length > 0
        ? votiPubblico.reduce((s, v) => s + v.valore, 0) / votiPubblico.length
        : null

      // Punteggio ponderato: sposi 70%, pubblico 30%
      let punteggioFinale: number | null = null
      if (mediaSposi !== null && mediaPubblico !== null) {
        punteggioFinale = mediaSposi * 0.7 + mediaPubblico * 0.3
      } else if (mediaSposi !== null) {
        punteggioFinale = mediaSposi
      }

      return {
        ...f,
        public_url: supabase.storage.from('foto-contest').getPublicUrl(f.file_path).data.publicUrl,
        voto_sposi: mediaSposi,
        voto_pubblico: mediaPubblico,
        n_voti_pubblico: votiPubblico.length,
        punteggio_finale: punteggioFinale,
        votata_sposi: votiSposi.length > 0,
      }
    })

    // Classifica ordinata
    const classifica = [...risultati]
      .filter(r => r.punteggio_finale !== null)
      .sort((a, b) => (b.punteggio_finale ?? 0) - (a.punteggio_finale ?? 0))

    // Rileva pareggi
    const pareggi: number[][] = []
    if (classifica.length >= 2) {
      const top = classifica[0].punteggio_finale ?? 0
      const tied = classifica.filter(r => Math.abs((r.punteggio_finale ?? 0) - top) < 0.001)
      if (tied.length > 1) pareggi.push(tied.map(r => r.tavolo))
    }

    return NextResponse.json({ fotos: risultati, classifica, pareggi })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}