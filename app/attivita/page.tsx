'use client'; // 1. Fondamentale per usare bottoni e memoria

import { useState } from 'react';
import Link from 'next/link';

export default function AttivitaPage() {
  // 2. Definiamo la "memoria" del componente
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proposta, setProposta] = useState("");

  return (
    <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
        <h1 className="text-2xl font-bold">Proposte</h1>
      </div>

      <div className="space-y-4">
        {/* Proposta statica di esempio */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold">Torneo di Padel 🎾</h3>
          <p className="text-sm text-slate-500">Voti: 12</p>
        </div>

        {/* 3. Se il form è aperto, lo mostriamo. Altrimenti mostriamo il bottone + */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-400 animate-in fade-in zoom-in duration-200">
            <h2 className="font-bold mb-4">Nuova Proposta</h2>
            <input 
              type="text" 
              placeholder="Cosa vuoi fare?" 
              className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 ring-blue-500"
              value={proposta}
              onChange={(e) => setProposta(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-2 bg-slate-100 rounded-lg font-medium"
              >
                Annulla
              </button>
              <button 
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium"
                onClick={() => {
                  alert("Hai proposto: " + proposta);
                  setIsFormOpen(false);
                  setProposta("");
                }}
              >
                Invia
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500 font-medium"
          >
            + Aggiungi una proposta
          </button>
        )}
      </div>
    </main>
  );
}