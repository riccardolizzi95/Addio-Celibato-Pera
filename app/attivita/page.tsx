import Link from 'next/link';

export default function AttivitaPage() {
  return (
    <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
      {/* Intestazione */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-blue-600 font-semibold flex items-center gap-2">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold">Proposte Attività</h1>
      </div>

      {/* Lista delle Proposte (Placeholder) */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 italic">"Esempio: Torneo di Padel"</h3>
          <p className="text-slate-600 text-sm mt-1">Proposto da: Riccardo</p>
          <div className="mt-4 flex items-center gap-4">
            <button className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium">👍 12 voti</button>
            <button className="text-blue-600 text-sm font-medium underline">Dettagli link</button>
          </div>
        </div>

        {/* Bottone per aggiungere */}
        <button className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors">
          + Aggiungi una proposta
        </button>
      </div>
    </main>
  );
}