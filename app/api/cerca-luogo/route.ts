import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&accept-language=it`,
            {
                headers: {
                    'User-Agent': 'MissionePera/1.0 (addio-celibato-pera.vercel.app)',
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json([], { status: 200 });
        }

        const data = await res.json();

        const risultati = data.map((item: any) => ({
            nome: item.name || '',
            indirizzo: item.display_name || '',
            lat: item.lat,
            lon: item.lon,
            tipo: item.type || '',
        }));

        return NextResponse.json(risultati);
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}