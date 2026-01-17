'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AttivitaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proposta, setProposta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [listaProposte, setListaProposte] = useState<any[]>([]);

  // Carica i dati dal DB
  const scaricaDati = async () => {
    const { data, error } = await supabase
      .from('proposte')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Errore download:", error);
    } else {
      setListaProposte(data || []);
    }
  };

  useEffect(() => {
    scaricaDati();
  }, []);

  // Invia nuova proposta
  const inviaPropostaAlDatabase = async () => {
    if (!proposta) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('proposte')
      .insert([{ titolo: proposta, creatore: 'Riccardo', voti: 0 }]);

    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else {
      setProposta("");
      setIsFormOpen(false);
      scaricaDati();
    }
    setIsLoading(false);
  };

  // Funzione per VOTARE
  const votaProposta = async (id: number, votiAttuali: number) => {
    const { error } = await supabase
      .from('proposte')
      .update({ voti: votiAttuali + 1 })
      .eq('id', id);

    if (error) {
      console.error("Errore voto:", error);
    } else {
      scaricaDati(); // Rinfresca la lista per vedere il nuovo numero
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-slate-50 text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-blue-600 font-semibold">← Home</Link>
        <h1 className="text-2xl font-bold">Proposte</h1>
      </div>

      <div className="space-y-4">
        {listaProposte.length === 0 ? (
          <p className="text-center text-slate-400 py-10 italic">Nessuna proposta ancora...</p>
        ) : (
          listaProposte.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg">{item.titolo}</h3>
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-slate-400">Da: {item.creatore}</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => votaProposta(item.id, item.voti)}
                    className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold active:scale-90 transition-transform"
                  >
                    👍 {item.voti}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {isFormOpen ? (
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-400">
            <h2 className="font-bold mb-4 text-lg">Cosa vuoi proporre?</h2>
            <input 
              type="text" 
              placeholder="Esempio: Aperitivo in barca" 
              className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 ring-blue-500"
              value={proposta}
              onChange={(e) => setProposta(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="flex-1 py-3 bg-slate-100 rounded-xl font-medium"
              >
                Annulla
              </button>
              <button 
                onClick={inviaPropostaAlDatabase}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {isLoading ? "Invio..." : "Conferma"}
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-500 font-medium hover:bg-slate-100 transition-colors"
          >
            + Aggiungi una proposta
          </button>
        )}
      </div>
    </main>
  );
}