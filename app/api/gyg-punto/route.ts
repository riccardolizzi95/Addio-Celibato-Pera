import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') || '';

    if (!url.trim()) {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    // Verifica che sia un link GYG
    try {
        const u = new URL(url);
        if (!u.hostname.includes('getyourguide.com')) {
            return NextResponse.json({ punto: null }, { status: 200 });
        }
    } catch {
        return NextResponse.json({ punto: null }, { status: 200 });
    }

    // Pulisci l'URL (rimuovi parametri tracking, usa versione inglese per parsing più facile)
    let cleanUrl = url.split('?')[0];
    // Converti da /it-it/ a /en/ per avere "Please meet at..." 
    cleanUrl = cleanUrl.replace(/\/[a-z]{2}-[a-z]{2}\//, '/');
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://www.getyourguide.com' + cleanUrl;

    try {
        // Tenta il fetch della pagina GYG con header da browser
        const res = await fetch(cleanUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
        });

        if (!res.ok) {
            return NextResponse.json({ punto: null, debug: `GYG returned ${res.status}` }, { status: 200 });
        }

        const html = await res.text();

        // Strategia 1: cerca "Please meet at" (versione EN) o "punto d'incontro è presso" (IT)
        let indirizzo: string | null = null;

        // Pattern EN: "Please meet at Rhoneweg 1, 1043 CT Amsterdam, Netherlands"
        const enMatch = html.match(/Please meet at\s+([^<"]+?)(?:\.|<)/i);
        if (enMatch) {
            indirizzo = enMatch[1].trim();
        }

        // Pattern IT: "Il punto d'incontro è presso Rhoneweg 1, 1043 CT Amsterdam"
        if (!indirizzo) {
            const itMatch = html.match(/punto d['']incontro è presso\s+([^<"]+?)(?:\.|<)/i);
            if (itMatch) {
                indirizzo = itMatch[1].trim();
            }
        }

        // Strategia 2: cerca nell'HTML embedded JSON (spesso GYG ha dati strutturati)
        if (!indirizzo) {
            // Cerca JSON-LD con location/address
            const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
            for (const m of jsonLdMatches) {
                try {
                    const data = JSON.parse(m[1]);
                    if (data.location?.address) {
                        const addr = data.location.address;
                        indirizzo = typeof addr === 'string' ? addr : 
                            [addr.streetAddress, addr.postalCode, addr.addressLocality, addr.addressCountry].filter(Boolean).join(', ');
                    }
                } catch {}
            }
        }

        // Strategia 3: cerca pattern generico di indirizzo dopo "meeting point" o "Meeting Point"
        if (!indirizzo) {
            const mpMatch = html.match(/[Mm]eeting [Pp]oint[^<]*?(\d+[A-Za-z\s,.\-]+\d{4}\s*[A-Z]{1,2}\s+[A-Za-z]+)/);
            if (mpMatch) {
                indirizzo = mpMatch[1].trim();
            }
        }

        if (indirizzo) {
            // Cerca l'indirizzo trovato su Google Places per ottenere coordinate e nome formale
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;
            if (apiKey) {
                const placesRes = await fetch(
                    `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
                    `query=${encodeURIComponent(indirizzo)}` +
                    `&language=it` +
                    `&key=${apiKey}`
                );
                if (placesRes.ok) {
                    const placesData = await placesRes.json();
                    if (placesData.results?.length > 0) {
                        const primo = placesData.results[0];
                        return NextResponse.json({
                            punto: {
                                nome: primo.name || indirizzo,
                                indirizzo: primo.formatted_address || indirizzo,
                                lat: primo.geometry?.location?.lat,
                                lon: primo.geometry?.location?.lng,
                            },
                        });
                    }
                }
            }

            // Anche senza Google Places, restituisci l'indirizzo raw
            return NextResponse.json({
                punto: {
                    nome: 'Punto di incontro',
                    indirizzo: indirizzo,
                    lat: null,
                    lon: null,
                },
            });
        }

        return NextResponse.json({ punto: null }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ punto: null, debug: e.message }, { status: 200 });
    }
}