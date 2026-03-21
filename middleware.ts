import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Controlla solo il cookie di sessione Supabase — senza refreshare il token
  // Il refresh avviene lato client tramite createBrowserClient in modo sicuro
  const pathname = request.nextUrl.pathname;

  // Pagine pubbliche — sempre accessibili
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Cerca il cookie di sessione Supabase (può avere nomi diversi)
  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  if (!hasSession) {
    const url = request.nextUrl.clone();
    const returnTo = url.pathname + url.search;
    url.pathname = '/login';
    url.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};