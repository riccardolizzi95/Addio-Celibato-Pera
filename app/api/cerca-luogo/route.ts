import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
        return NextResponse.json([], { status: 200 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key non configurata' }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
            `query=${encodeURIComponent(q)}` +
            `&location=52.3676,4.9041` +
            `&radius=15000` +
            `&language=it` +
            `&key=${apiKey}`
        );

        if (!res.ok) {
            return NextResponse.json([], { status: 200 });
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const risultati = data.results.slice(0, 5).map((item: any) => ({
            nome: item.name || '',
            indirizzo: item.formatted_address || '',
            lat: item.geometry?.location?.lat,
            lon: item.geometry?.location?.lng,
            rating: item.rating || null,
            tipo: item.types?.[0] || '',
        }));

        return NextResponse.json(risultati);
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}