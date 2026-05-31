import { useState } from 'react'
import supabase from '../lib/supabase'
import styles from './FormRecensione.module.css'

//componente che implementa il form tramite cui un acquirente lascia una recensone
// a un venditore di cui ha accettato l'offerta e che non ha ancora recensito

//prende in input: il vednitoreid, cioè colui a cui facciamo la recensione
//annuncio id cioè quale annuncio ha accettato
//sessione che contiene le info dell'acquirente che compila il form
//onInviata funzione gestione una volta mandato l form
export default function FormRecensione({ venditoreid, annuncioid, sessione, onInviata }) {


  const [stelle, setStelle] = useState(0) //var di stato per le stelle
  const [hover, setHover] = useState(0) //var di stato per quante stelle stiamo per cliccare
  const [testo, setTesto] = useState('') // testo scritto nella casella
  const [loading, setLoading] = useState(false) //per bloccare se sto caricando
  const [errore, setErrore] = useState(null) //per errore

  //funzione che salva i dati
  async function handleInvia() {
    setLoading(true)
    setErrore(null)

    // inseriamo la recensione nella table supabase
    const { error } = await supabase
      .from('recensioni')
      .insert({
        acquirente_id: sessione.user.id,
        venditore_id: venditoreid,
        annuncio_id: annuncioid,
        stelle,
        testo: testo.trim() || null
      })

    if (error) {
      console.error("Dettagli errore Supabase:", error)
      //Se fallisce, mostriamo a schermo L'ERRORE VERO E PROPRIO
      setErrore("Errore del Database: " + error.message)
    } else {
      // Se va a buon fine, ricarichiamo la pagina.
      // Così scaricherà la recensione in modo pulito e sicuro!
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.titolo}>Lascia una recensione</h3>
      <p className={styles.sub}>Condividi la tua esperienza con questa azienda.</p>

      <div className={styles.stelleRow}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            // Se il numero della stella (es. stella 3) è <= a quello che sto toccando col mouse (hover)
            // OPPURE a quello che ho cliccato (stelle), si colora di dorato aggiungendo la classe "attiva"
            className={`${styles.stellaBtn} ${n <= (hover || stelle) ? styles.attiva : ''}`}
            // Quando il mouse passa sopra, memorizza questo numero (es. passa sopra la 4, hover diventa 4)
            onMouseEnter={() => setHover(n)}
            // Quando il mouse esce dal pulsante, azzera l'hover (così tornano grigie se non ho cliccato)
            onMouseLeave={() => setHover(0)}
            // Quando clicco, fissa permanentemente il voto nella memoria "stelle"
            onClick={() => setStelle(n)}
            type="button"
          >
            ★
          </button>
        ))}
        {stelle > 0 && (
          <span className={styles.stellaLabel}>
            {/* usiamo il numero di stelle come indice di un dizionario*/ }
            {['', 'Pessimo', 'Scarso', 'Nella media', 'Buono', 'Eccellente'][stelle]}
          </span>
        )}
      </div>

      <textarea
        className={styles.textarea}
        placeholder="Descrivi la tua esperienza (opzionale)..."
        value={testo}
        onChange={e => setTesto(e.target.value)}
        rows={4}
      />

      {errore && <p className={styles.errore}>{errore}</p>}

      <button
        className={styles.btnInvia}
        onClick={handleInvia}
        disabled={loading || stelle === 0}
      >
        {loading ? 'Invio...' : 'Pubblica recensione'}
      </button>
    </div>
  )
}