import { useState } from 'react';
import styles from './Supporto.module.css';

/*
qusto componente React crea la pagina supporto nel menù a tendina nella home 

*/

export default function Supporto() {
  //creo la variabile di stato Ricerca per il testo che l'utente scrive nella barra di ricerca
  const [ricerca, setRicerca] = useState("");
  //domande che compaiono al di sotto della barra di ricerca 
  const faq = [
    { q: "Come posso pubblicare un annuncio?", a: "Dopo aver effettuato l'accesso come acquirente, clicca su 'I miei annunci' e poi su 'Nuovo annuncio' oppure sulla Home. Compila i dettagli e pubblica." },
    { q: "Come funzionano i preventivi?", a: "I venditori possono visualizzare gli annunci e inviare una proposta economica. Riceverai una notifica non appena un preventivo sarà disponibile." },
    { q: "Il servizio è gratuito?", a: "La registrazione e la consultazione degli annunci sono gratuite. Potrebbero esserci commissioni per servizi premium." },
    { q: "Come posso modificare il mio profilo?", a: "Vai nelle impostazioni dal menu a tendina della navbar per aggiornare i tuoi dati personali o aziendali." },
    { q: "Cosa fare se dimentico la password?", a: "Nella pagina di login, clicca su 'Password dimenticata' per ricevere un link di ripristino via email." },
    { q: "Si può chattare con un bot in caso di non risposte?", a:"Purtroppo non è stato ancora implementato un chatbot che lo permetta, ci stiamo lavorando."}
  ];

  // Filtra le FAQ in base a cosa scrive l'utente, cioè con la filter restituisco un nuovo array in cui valuto se ogni elemento supera una 
  // certa condizione, cioè se il contenuto di ricerca è incluso in una domanda di quelle presenti
  const faqFiltrate = faq.filter(item => 
    item.q.toLowerCase().includes(ricerca.toLowerCase())
  );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Centro Supporto<span className={styles.dot}>.</span></h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Domande Frequenti</h2>
        
        {/* Barra di Ricerca */}
        <div className={styles.searchWrapper}>
          <input 
            type="text" 
            placeholder="Cerca una domanda..." 
            className={styles.searchInput}
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.grid}>
          {faqFiltrate.length > 0 ? (
            faqFiltrate.map((item, index) => (
              <div key={index} className={styles.card}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))
          ) : (
            <p className={styles.noResults}>Nessun risultato trovato per "{ricerca}"</p>
          )}
        </div>
      </section>

      <section className={styles.contact}>
        <h2>Hai ancora bisogno di aiuto?</h2>
        <p>Il nostro team risponde entro 24 ore lavorative.</p>
        <a href="mailto:supporto@connetti.it" className={styles.contactButton}>
          Contattaci via Email
        </a>
      </section>
    </main>
  );
}