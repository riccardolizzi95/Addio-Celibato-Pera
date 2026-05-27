import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const tavolo = parseInt(formData.get('tavolo') as string)
    const nomePersona = (formData.get('nome_persona') as string)?.trim()
    const titolo = (formData.get('titolo') as string)?.trim()
    const file = formData.get('foto') as File | null

    if (!tavolo || tavolo < 1 || tavolo > 9)
      return NextResponse.json({ error: 'Tavolo non valido (1-9)' }, { status: 400 })
    if (!nomePersona)
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    if (!titolo)
      return NextResponse.json({ error: 'Titolo obbligatorio' }, { status: 400 })
    if (!file)
      return NextResponse.json({ error: 'Foto obbligatoria' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ error: 'Formato non supportato. Usa JPG, PNG o WEBP.' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Foto troppo grande. Massimo 10MB.' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'

    // Contatore foto già caricate da questa persona per questo tavolo
    const { count } = await supabase
      .from('foto_contest')
      .select('*', { count: 'exact', head: true })
      .eq('tavolo', tavolo)
      .eq('nome_persona', nomePersona)

    const contatore = (count ?? 0) + 1
    const safeName = nomePersona.replace(/[^a-zA-Z0-9]/g, '_')
    const ts = Date.now()
    const fileName = `${tavolo}_${safeName}_${contatore}_${ts}.${ext}`
    const storagePath = `tavolo_${tavolo}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload su Supabase Storage
    const { error: storageErr } = await supabase.storage
      .from('foto-contest')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })
    if (storageErr) throw new Error(`Storage: ${storageErr.message}`)

    // Salva record DB
    const { data, error: dbErr } = await supabase
      .from('foto_contest')
      .insert({
        tavolo,
        nome_persona: nomePersona,
        titolo,
        file_path: storagePath,
        contatore,
        is_ufficiale: false,
      })
      .select()
      .single()

    if (dbErr) throw new Error(`DB: ${dbErr.message}`)

    return NextResponse.json({ success: true, foto: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto'
    console.error('Upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}