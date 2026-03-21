import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const da = searchParams.get('da') || '';
    const a  = searchParams.get('a')  || '';

    if (!da || !a) {
        return NextResponse.json({ error: 'Mancano da/a' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const client = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await client.functions.invoke('calcola-tratta', {
        body: null,
        headers: {},
        // passiamo i params nella query string della invocazione
    });

    // Invochiamo direttamente via fetch con service role
    const res = await fetch(
        `${supabaseUrl}/functions/v1/calcola-tratta?da=${encodeURIComponent(da)}&a=${encodeURIComponent(a)}`,
        {
            headers: {
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!res.ok) {
        return NextResponse.json({ error: 'Errore Edge Function' }, { status: 500 });
    }

    const dati = await res.json();
    return NextResponse.json(dati);
}