import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET — leggi stato attuale
export async function GET() {
  const { data, error } = await supabase
    .from('presentazione_stato')
    .select('attiva, foto_corrente_id')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — aggiorna stato (chiamato dalla presentazione)
export async function POST(req: NextRequest) {
  try {
    const { attiva, foto_corrente_id } = await req.json()

    const { data, error } = await supabase
      .from('presentazione_stato')
      .update({ attiva, foto_corrente_id, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, stato: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}