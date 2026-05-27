import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const tavolo = parseInt(req.nextUrl.searchParams.get('tavolo') ?? '')

  if (isNaN(tavolo) || tavolo < 1 || tavolo > 9)
    return NextResponse.json({ error: 'Tavolo non valido' }, { status: 400 })

  const { data, error } = await supabase
    .from('foto_contest')
    .select('*')
    .eq('tavolo', tavolo)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = data.map((f) => ({
    ...f,
    public_url: supabase.storage
      .from('foto-contest')
      .getPublicUrl(f.file_path).data.publicUrl,
  }))

  return NextResponse.json({ foto: withUrls })
}