import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const date = searchParams.get('date');

    if (!code || !date) {
        return NextResponse.json({ error: 'Codice e data obbligatori' }, { status: 400 });
    }

    const cleanCode = code.replace(/\s+/g, '').toUpperCase();

    try {
        const res = await fetch(
            `https://aerodatabox.p.rapidapi.com/flights/number/${cleanCode}/${date}`,
            {
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
                    'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: 'Volo non trovato' }, { status: 404 });
        }

        const data = await res.json();
        const volo = data && data.length > 0 ? data[0] : null;

        if (!volo) {
            return NextResponse.json({ error: 'Volo non trovato. Verifica il codice.' }, { status: 404 });
        }

        return NextResponse.json(volo);
    } catch {
        return NextResponse.json({ error: 'Errore nella chiamata API' }, { status: 500 });
    }
}