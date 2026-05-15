import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import styles from './Chat.module.css';

/*
componente react che implementa una finestra di chat nella parte bassa a destra dello schermo 
che permette a un venditore e un acquirente di inviarsi i messaggi una volta accettata l'offerta dall'acquirente
utilizzando Supabase come backend, in cui abbiam creato una table messaggi per tenere traccia dei messaggi mandati nelle varie chat
*/



//definisco la funzione componente Chat che prende in input dal props 4 variabili:
// prevID che è l'ID dell'offerta, utentc.. che è chi sta usando l'app, il destinatario cioè chi riceve il messaggio 
// onClose che è una funzione per chiudere la chat 

export default function ChatBox({ preventivoId, utenteCorrenteId, destinatarioId, onClose }) {
  const [messaggi, setMessaggi] = useState([]);
  const [nuovoMessaggio, setNuovoMessaggio] = useState('');


  /*
  Definisco due variabili di stato tramite la useState:
  messaggi, cioè un array che contiene i messaggi per una singola chat
  nuovoMessaggio, inizializzato a stringa vuota che contiene il testo del messaggio prima di premere invia 
  */

  //chiamo la useeffetct al primo caricamento e ogni volta che cambio il preventivoID 

  useEffect(() => {
    // se la variabile preventivo è null 0 undefined o il resto, supabase dà errore, perché la chat deve essere associata a una offerta
    if (!preventivoId) return;

    // query a Supabase per scaricare tutti i messaggi (select * ) dalla table messaggi associati a quel preventivo id e ordinadoli dal meno recente al più recente 
    // e carico i messaggi nella variabile di stato messaggi 
    const fetchMessaggi = async () => {
      const { data } = await supabase
        .from('messaggi')
        .select('*')
        .eq('preventivo_id', preventivoId)
        .order('created_at', { ascending: true });
      setMessaggi(data || []);
    };
    //chiamo la funzione definita sopra 
    fetchMessaggi();

    //Questo componente supabase si mantiene attivo sulla chat associata a preventivoID 
    //ogni volta che viene inserito (event: INSERT) un messaggio nella tabella messaggi che ha lo stesso preventivoID 
    //supabse invia un segnale al browser e il nuovo messaggio viene aggiunto instantaneamente alla lista senza ricaricare la pagina

    const canale = supabase
      .channel(`chat-${preventivoId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messaggi', filter: `preventivo_id=eq.${preventivoId}` }, 
        payload => {
          setMessaggi((prev) => [...prev, payload.new]);
        }
      )
      .subscribe(); //apre una Web Socket in modo tale che fatto quello scritto prima mi manda subito i dati

    return () => {
      supabase.removeChannel(canale); //serve a disattivare "l'ascolto" quando l'utente chiude la chat 
    };
  }, [preventivoId]);

  const inviaMessaggio = async (e) => {
    e.preventDefault(); //blocca il refresh della pagina (non perdendo tutti i dati tipo var di stato)
    
    // verifichiamo che il testo del nuovo mess non sia vuoto o che non ci sia il destinatario 
    if (!nuovoMessaggio.trim() || !destinatarioId) {
        console.error("Errore: manca il destinatario o il testo è vuoto");
        return;
    } 
    //faccio una query supabase in cui inserisco nella table messaggi un nuovo messaggio che ha id e created_at presi 
    //automaticamente, come testo il testo di nuovoMessaggio, preventivo_ID il preventivoID dell'offerta, mittente_id l'utente corrente
    // e destinatario_id quello attuale 
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

    //verifico se c'è errore 
    if (error) {
      console.error("Errore Supabase:", error.message);
      alert("Errore: " + error.message);
    //ripulisco la barra 
    } else {
      setNuovoMessaggio(''); 
    }
  };

  
  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <span>Chat Trattativa</span>
        <button onClick={onClose} >×</button>
      </div>
      <div className={styles.messaggiList}>
        {messaggi.map(m => (  //con la map assegno a ogni messaggio un riquadro
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
          onChange={e => setNuovoMessaggio(e.target.value)} //ogni volta che scrivo lo memorizza in nuovo messaggio
          placeholder="Scrivi un messaggio..." 
          autoFocus
        />
        <button type="submit" disabled={!nuovoMessaggio.trim()}>Invia</button> 
      </form>
    </div>
  );
}