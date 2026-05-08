import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import styles from './Chat.module.css';

export default function ChatBox({ preventivoId, utenteCorrenteId, destinatarioId, onClose }) {
  const [messaggi, setMessaggi] = useState([]);
  const [nuovoMessaggio, setNuovoMessaggio] = useState('');

  useEffect(() => {
    if (!preventivoId) return;

    const fetchMessaggi = async () => {
      const { data } = await supabase
        .from('messaggi')
        .select('*')
        .eq('preventivo_id', preventivoId)
        .order('created_at', { ascending: true });
      setMessaggi(data || []);
    };

    fetchMessaggi();

    const canale = supabase
      .channel(`chat-${preventivoId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messaggi', filter: `preventivo_id=eq.${preventivoId}` }, 
        payload => {
          setMessaggi((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canale);
    };
  }, [preventivoId]);

  const inviaMessaggio = async (e) => {
    e.preventDefault();
    
    // VERIFICA DATI: Guarda la console del browser quando premi invia
    /*
    console.log("Dati invio:", { 
      testo: nuovoMessaggio, 
      preventivo_id: preventivoId, 
      mittente_id: utenteCorrenteId, 
      destinatario_id: destinatarioId 
    });
    */
    if (!nuovoMessaggio.trim() || !destinatarioId) {
        console.error("Errore: manca il destinatario o il testo è vuoto");
        return;
    } 

    const { error } = await supabase
      .from('messaggi')
      .insert([
        { 
          testo: nuovoMessaggio.trim(), 
          preventivo_id: preventivoId, 
          mittente_id: utenteCorrenteId,
          destinatario_id: destinatarioId 
        }
      ]);

    if (error) {
      console.error("Errore Supabase:", error.message);
      alert("Errore: " + error.message);
    } else {
      setNuovoMessaggio(''); 
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <span>Chat Trattativa</span>
        <button onClick={onClose} className={styles.closeBtn}>×</button>
      </div>
      <div className={styles.messaggiList}>
        {messaggi.map(m => (
          <div 
            key={m.id} 
            className={m.mittente_id === utenteCorrenteId ? styles.mio : styles.altro}
          >
            {m.testo}
          </div>
        ))}
      </div>
      <form onSubmit={inviaMessaggio} className={styles.inputArea}>
        <input 
          value={nuovoMessaggio} 
          onChange={e => setNuovoMessaggio(e.target.value)} 
          placeholder="Scrivi un messaggio..." 
          autoFocus
        />
        <button type="submit" disabled={!nuovoMessaggio.trim()}>Invia</button>
      </form>
    </div>
  );
}