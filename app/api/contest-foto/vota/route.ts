import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { foto_id, tavolo_foto, tipo, valore, device_fingerprint } = await req.json()

    if (!foto_id || !tavolo_foto || !tipo || !valore)
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    if (!['sposi', 'pubblico'].includes(tipo))
      return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 })
    if (valore < 1 || valore > 10)
      return NextResponse.json({ error: 'Valore non valido (1-10)' }, { status: 400 })

    // Controlla voto duplicato per pubblico (stesso device)
    if (tipo === 'pubblico' && device_fingerprint) {
      const { data: existing } = await supabase
        .from('voti_contest')
        .select('id')
        .eq('foto_id', foto_id)
        .eq('tipo', 'pubblico')
        .eq('device_fingerprint', device_fingerprint)
        .single()

      if (existing)
        return NextResponse.json({ error: 'Hai già votato questa foto', alreadyVoted: true }, { status: 409 })

      // Controlla limite 15 voti pubblico per tavolo per foto
      const { count } = await supabase
        .from('voti_contest')
        .select('*', { count: 'exact', head: true })
        .eq('foto_id', foto_id)
        .eq('tipo', 'pubblico')

      if ((count ?? 0) >= 15)
        return NextResponse.json({ error: 'Limite voti raggiunto per questa foto', limitReached: true }, { status: 429 })
    }

    // Per voto sposi — sovrascrive se esiste già
    if (tipo === 'sposi') {
      const { data: existing } = await supabase
        .from('voti_contest')
        .select('id')
        .eq('foto_id', foto_id)
        .eq('tipo', 'sposi')
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('voti_contest')
          .update({ valore })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ success: true, voto: data, updated: true })
      }
    }

    const { data, error } = await supabase
      .from('voti_contest')
      .insert({ foto_id, tavolo_foto, tipo, valore, device_fingerprint })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, voto: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}