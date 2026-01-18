'use client';
import Link from 'next/link';

export default function VoliSoon() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 text-center">
      <div className="w-full max-w-sm">
        <span className="text-8xl mb-6 block animate-bounce">✈️</span>
        <h1 className="text-4xl font-black mb-2 tracking-tight">Voli & Alloggi</h1>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
          I piloti stanno scaldando i motori... <br/>
          Questa sezione sarà disponibile a breve!
        </p>
        <Link href="/" className="inline-block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">
          Torna alla base (Home)
        </Link>
      </div>
    </main>
  );
}