import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  const serviceClient = getServiceClient()
  const { data: { user }, error } = await serviceClient.auth.getUser(token)
  if (error || !user) return null
  const { data: profilo } = await serviceClient.from('profili').select('admin').eq('id', user.id).single()
  return profilo?.admin ? user : null
}

export async function POST(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    // 1. Cancella tutti i voti
    const { error: votiErr } = await supabase
      .from('voti_contest')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // cancella tutto

    if (votiErr) throw new Error(`Voti: ${votiErr.message}`)

    // 2. Resetta stato presentazione + aggiorna reset_at
    const resetAt = new Date().toISOString()
    const { error: statoErr } = await supabase
      .from('presentazione_stato')
      .update({ attiva: false, foto_corrente_id: null, updated_at: resetAt, reset_at: resetAt })
      .eq('id', 1)

    if (statoErr) throw new Error(`Stato: ${statoErr.message}`)

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}