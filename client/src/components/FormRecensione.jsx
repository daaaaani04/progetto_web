import { useState } from 'react'
import supabase from '../lib/supabase'
import styles from './FormRecensione.module.css'

export default function FormRecensione({ venditoreid, annuncioid, sessione, onInviata }) {
  const [stelle, setStelle] = useState(0)
  const [hover, setHover] = useState(0)
  const [testo, setTesto] = useState('')
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)

  async function handleInvia() {
    if (stelle === 0) return setErrore('Seleziona almeno una stella.')
    setLoading(true)
    setErrore(null)

    const { data, error } = await supabase
    .from('recensioni')
    .insert({
      acquirente_id: sessione.user.id,
      venditore_id: venditoreid,
      annuncio_id: annuncioid,
      stelle,
      testo: testo.trim() || null
    })
    .select(`id, stelle, testo, created_at, profiles!recensioni_acquirente_id_fkey(nome, cognome)`)
    .single()

    if (error) {
      console.log(error)
      setErrore('Errore durante l\'invio. Riprova.')
    } else {
      onInviata(data)
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
            className={`${styles.stellaBtn} ${n <= (hover || stelle) ? styles.attiva : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStelle(n)}
            type="button"
          >
            ★
          </button>
        ))}
        {stelle > 0 && (
          <span className={styles.stellaLabel}>
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