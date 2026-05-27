import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { foto_id, tavolo } = await req.json()

    if (!foto_id || !tavolo)
      return NextResponse.json({ error: 'foto_id e tavolo obbligatori' }, { status: 400 })

    // Rimuovi flag ufficiale da tutte le foto del tavolo
    await supabase
      .from('foto_contest')
      .update({ is_ufficiale: false })
      .eq('tavolo', tavolo)

    // Imposta la nuova foto come ufficiale
    const { data: foto, error: updateErr } = await supabase
      .from('foto_contest')
      .update({ is_ufficiale: true })
      .eq('id', foto_id)
      .select()
      .single()

    if (updateErr) throw new Error(updateErr.message)

    return NextResponse.json({ success: true, foto })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto'
    console.error('Set ufficiale error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}