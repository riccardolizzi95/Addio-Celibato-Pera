import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Elimina tutte le foto di un tavolo (usato per sovrascrittura)
export async function DELETE(req: NextRequest) {
  try {
    const { tavolo } = await req.json()
    if (!tavolo || tavolo < 1 || tavolo > 9)
      return NextResponse.json({ error: 'Tavolo non valido' }, { status: 400 })

    const { data: fotos } = await supabase
      .from('foto_contest').select('id, file_path').eq('tavolo', tavolo)

    if (!fotos?.length) return NextResponse.json({ success: true, deleted: 0 })

    const paths = fotos.map(f => f.file_path)
    await supabase.storage.from('foto-contest').remove(paths)
    await supabase.from('foto_contest').delete().eq('tavolo', tavolo)

    return NextResponse.json({ success: true, deleted: fotos.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}