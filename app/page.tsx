export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <span className="text-6xl mb-4 block">🍐</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Missione Pera
        </h1>
        <p className="mt-2 text-slate-600">
          Il centro di comando per l'addio al celibato più epico di sempre.
        </p>
        
        <div className="mt-8 space-y-4">
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-all">
            ✈️ Voli & Alloggi
          </button>
          <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 active:scale-95 transition-all">
            🎉 Proponi Attività
          </button>
          <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-amber-200 active:scale-95 transition-all">
            💰 Gestione Spese
          </button>
        </div>
      </div>
    </main>
  );
}