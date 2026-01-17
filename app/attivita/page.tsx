'use client';

import { useState } from 'react';
import Link from 'next/link';
// 1. Importiamo il client di Supabase che abbiamo configurato
import { supabase } from '@/lib/supabase'; 

export default function AttivitaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proposta, setProposta] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Per gestire l'attesa del caricamento

  // 2. Creiamo la funzione "magica" che invia i dati al database
  const inviaPropostaAlDatabase = async () => {
    if (!proposta) return; // Non inviare se il campo è vuoto

    setIsLoading(true); // Mostriamo "Salvataggio..." sul bottone

    // Qui diciamo a Supabase: "Inserisci nella tabella 'proposte' questo oggetto"
    const { data, error } = await supabase
      .from('proposte') 
      .insert([
        { 
          titolo: proposta, 
          creatore: 'Riccardo', // Per ora mettiamo il tuo nome fisso
          voti: 0 
        }
      ]);

    if (error) {
      console.error("Errore Supabase:", error);
      alert("Errore nel salvataggio: " + error.message);
    } else {
      alert("Proposta inviata con successo! 🚀");
      setProposta(""); // Puliamo il campo
      setIsFormOpen(false); // Chiudiamo il modulo
    }

    setIsLoading(false); // Finito!
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
        <h1 className="text-2xl font-bold">Proposte</h1>
      </div>

      <div className="space-y-4">
        {/* Esempio statico che avevamo (lo toglieremo presto) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 opacity-50 text-slate-400">
          <h3 className="font-bold">Esempio: Torneo di Padel 🎾</h3>
        </div>

        {isFormOpen ? (
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-400">
            <h2 className="font-bold mb-4">Nuova Proposta</h2>
            <input 
              type="text" 
              placeholder="Cosa vuoi fare?" 
              className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 ring-blue-500"
              value={proposta}
              onChange={(e) => setProposta(e.target.value)}
              disabled={isLoading} // Disabilita l'input mentre carica
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-2 bg-slate-100 rounded-lg font-medium"
                disabled={isLoading}
              >
                Annulla
              </button>
              <button 
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-blue-300"
                onClick={inviaPropostaAlDatabase} // 3. Ora chiamiamo la funzione del database!
                disabled={isLoading}
              >
                {isLoading ? "Invio in corso..." : "Invia Proposta"}
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