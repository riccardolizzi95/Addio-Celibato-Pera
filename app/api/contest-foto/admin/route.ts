import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client con service role per verificare l'utente lato server
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Client anonimo per storage e query normali
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

  const { data: profilo } = await serviceClient
    .from('profili')
    .select('admin')
    .eq('id', user.id)
    .single()

  return profilo?.admin ? user : null
}

export async function GET(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: fotos, error } = await supabase
    .from('foto_contest').select('*')
    .order('tavolo', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = fotos.map(f => ({
    ...f,
    public_url: supabase.storage.from('foto-contest').getPublicUrl(f.file_path).data.publicUrl
  }))

  const perTavolo: Record<number, typeof withUrls> = {}
  for (let i = 1; i <= 9; i++) perTavolo[i] = []
  withUrls.forEach(f => { if (perTavolo[f.tavolo]) perTavolo[f.tavolo].push(f) })

  return NextResponse.json({ fotos: withUrls, perTavolo, totFoto: fotos.length })
}

export async function DELETE(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { ids } = await req.json()
  if (!ids || !Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: 'ids obbligatorio' }, { status: 400 })

  const { data: fotos } = await supabase.from('foto_contest').select('id, file_path').in('id', ids)
  if (!fotos?.length) return NextResponse.json({ error: 'Foto non trovate' }, { status: 404 })

  const paths = fotos.map(f => f.file_path)
  const { error: storageErr } = await supabase.storage.from('foto-contest').remove(paths)
  if (storageErr) return NextResponse.json({ error: `Storage: ${storageErr.message}` }, { status: 500 })

  const { error: dbErr } = await supabase.from('foto_contest').delete().in('id', ids)
  if (dbErr) return NextResponse.json({ error: `DB: ${dbErr.message}` }, { status: 500 })

  return NextResponse.json({ success: true, deleted: ids.length })
}

export async function PATCH(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id, titolo, nome_persona } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (titolo !== undefined) updates.titolo = titolo
  if (nome_persona !== undefined) updates.nome_persona = nome_persona

  const { data, error } = await supabase.from('foto_contest').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, foto: data })
}