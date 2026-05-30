import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const foto_id = req.nextUrl.searchParams.get('foto_id')
  const fingerprint = req.nextUrl.searchParams.get('fingerprint')

  if (!foto_id || !fingerprint)
    return NextResponse.json({ hasVoted: false })

  const { data } = await supabase
    .from('voti_contest')
    .select('id')
    .eq('foto_id', foto_id)
    .eq('tipo', 'pubblico')
    .eq('device_fingerprint', fingerprint)
    .single()

  return NextResponse.json({ hasVoted: !!data })
}