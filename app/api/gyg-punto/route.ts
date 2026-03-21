import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') || '';

    if (!url.trim()) {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    // Estrai lo slug dell'attività dall'URL GYG
    let activitySlug = '';
    try {
        const u = new URL(url);
        if (!u.hostname.includes('getyourguide.com')) {
            return NextResponse.json({ punto: null }, { status: 200 });
        }
        const parts = u.pathname.split('/').filter(Boolean);
        const slugPart = parts.find(p => /-t\d+$/.test(p));
        if (slugPart) {
            activitySlug = slugPart;
        }
    } catch {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    if (!activitySlug) {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    try {
        // Cerca su Google il meeting point specifico della pagina GYG
        const nomeLeggibile = activitySlug.replace(/-t\d+$/, '').replace(/-/g, ' ');
        const searchQuery = `getyourguide ${nomeLeggibile} meeting point address Amsterdam`;

        // Usa Google Custom Search o in alternativa Google Places con l'indirizzo trovato
        // Strategia: cerchiamo direttamente su Google Places l'indirizzo che sappiamo
        // essere nella zona di Amsterdam, usando il nome dell'attività + "meeting point"
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
            `query=${encodeURIComponent(nomeLeggibile + ' meeting point Amsterdam')}` +
            `&location=52.3676,4.9041` +
            `&radius=20000` +
            `&language=it` +
            `&key=${apiKey}`
        );

        if (!res.ok) {
            return NextResponse.json({ punto: null }, { status: 200 });
        }

        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const primo = data.results[0];
            return NextResponse.json({
                punto: {
                    nome: primo.name || nomeLeggibile,
                    indirizzo: primo.formatted_address || '',
                    lat: primo.geometry?.location?.lat,
                    lon: primo.geometry?.location?.lng,
                },
            });
        }

        return NextResponse.json({ punto: null }, { status: 200 });
    } catch {
        return NextResponse.json({ punto: null }, { status: 200 });
    }
}