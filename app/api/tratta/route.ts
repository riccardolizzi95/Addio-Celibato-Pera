import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const da = searchParams.get('da') || '';
    const a  = searchParams.get('a')  || '';

    if (!da || !a) {
        return NextResponse.json({ error: 'Mancano da/a' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
        `${supabaseUrl}/functions/v1/calcola-tratta?da=${encodeURIComponent(da)}&a=${encodeURIComponent(a)}`,
        {
            headers: {
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!res.ok) {
        return NextResponse.json({ error: 'Errore calcolo tratta' }, { status: 500 });
    }

    const dati = await res.json();
    return NextResponse.json(dati);
}