'use client';

import { useState, useEffect } from 'react'; // Aggiungiamo useEffect
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AttivitaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proposta, setProposta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. Creiamo uno stato per contenere la lista delle proposte che arrivano dal DB
  const [listaProposte, setListaProposte] = useState<any[]>([]);

  // 2. Funzione per SCARICARE i dati dal database
  const scaricaDati = async () => {
    const { data, error } = await supabase
      .from('proposte')
      .select('*') // Prendi tutto
      .order('created_at', { ascending: false }); // Metti le più recenti in alto

    if (error) {
      console.error("Errore download:", error);
    } else {
      setListaProposte(data || []);
    }
  };

  // 3. Questo sensore dice: "Appena apri la pagina, scarica i dati"
  useEffect(() => {
    scaricaDati();
  }, []);

  const inviaPropostaAlDatabase = async () => {
    if (!proposta) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('proposte')
      .insert([{ titolo: proposta, creatore: 'Riccardo', voti: 0 }]);

    if (error) {
      alert("Errore: " + error.message);
    } else {
      setProposta("");
      setIsFormOpen(false);
      // 4. Molto importante: rinfreschiamo la lista dopo aver salvato!
      scaricaDati();
    }
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
        <h1 className="text-2xl font-bold">Proposte</h1>
      </div>

      <div className="space-y-4">
        {/* 5. Cicliamo sulla listaProposte per creare una card per ogni riga del DB */}
        {listaProposte.length === 0 ? (
          <p className="text-center text-slate-400 py-10 italic">Nessuna proposta ancora...</p>
        ) : (
          listaProposte.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg">{item.titolo}</h3>
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-slate-400">Da: {item.creatore}</p>
                <div className="flex items-center gap-2">
                   <button className="bg-slate-100 px-3 py-1 rounded-full text-sm">👍 {item.voti}</button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pulsante per aggiungere */}
        {isFormOpen ? (
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-400">
            <h2 className="font-bold mb-4">Nuova Proposta</h2>
            <input 
              type="text" 
              placeholder="Cosa vuoi fare?" 
              className="w-full p-3 border rounded-lg mb-4"
              value={proposta}
              onChange={(e) => setProposta(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <button onClick={() => setIsFormOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Annulla</button>
              <button 
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
                onClick={inviaPropostaAlDatabase}
                disabled={isLoading}
              >
                {isLoading ? "Caricamento..." : "Invia"}
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500"
          >
            + Aggiungi una proposta
          </button>
        )}
      </div>
    </main>
  );
}