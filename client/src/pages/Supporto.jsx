import { useState } from 'react';
import styles from './Supporto.module.css';

export default function Supporto() {
  const [ricerca, setRicerca] = useState("");

  const faq = [
    { q: "Come posso pubblicare un annuncio?", a: "Dopo aver effettuato l'accesso come acquirente, clicca su 'I miei annunci' e poi su 'Nuovo'. Compila i dettagli e pubblica." },
    { q: "Come funzionano i preventivi?", a: "I venditori possono visualizzare gli annunci e inviare una proposta economica. Riceverai una notifica non appena un preventivo sarà disponibile." },
    { q: "Il servizio è gratuito?", a: "La registrazione e la consultazione degli annunci sono gratuite. Potrebbero esserci commissioni per servizi premium." },
    { q: "Come posso modificare il mio profilo?", a: "Vai nelle impostazioni dal menu a tendina della navbar per aggiornare i tuoi dati personali o aziendali." },
    { q: "Cosa fare se dimentico la password?", a: "Nella pagina di login, clicca su 'Password dimenticata' per ricevere un link di ripristino via email." }
  ];

  // Filtra le FAQ in base a cosa scrive l'utente
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
        <a href="mailto:supporto@connetti.it" className={styles.contactBtn}>
          Contattaci via Email
        </a>
      </section>
    </main>
  );
}