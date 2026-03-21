import { NextRequest, NextResponse } from 'next/server';

// GetYourGuide blocca lo scraping server-side (403).
// Questa route restituisce null e il sistema usa il fallback: ricerca Google Places.
export async function GET(req: NextRequest) {
    return NextResponse.json({ punto: null }, { status: 200 });
}