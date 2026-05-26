// src/components/FormOfferta.jsx
import { useState } from 'react'
import supabase from '../lib/supabase'
import styles from './FormOfferta.module.css'


export default function FormOfferta({ annuncio, sessione, onClose, onSuccess, offertaEsistente }) {
  const [form, setForm] = useState({
    messaggio: '',
    prezzo: ''
  })
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrore(null)
    setLoading(true)
    
    /* tento di inserire un'offerta per un determinato annuncio, se gia presente ritorna errore */
    const { error } = await supabase
      .from('offerte')
      .insert({
        annuncio_id: annuncio.id,
        venditore_id: sessione.user.id,
        messaggio: form.messaggio,
        prezzo: form.prezzo ? parseFloat(form.prezzo) : null
      })

    setLoading(false)

    if (error) {
      // errore unicità — offerta già inviata
      if (error.code === '23505') {
        return setErrore('Hai già inviato un\'offerta per questo annuncio.')
      }
      return setErrore(error.message)
    }
    // arriva qui solo se non ha incontrato nessun erorre e chiama la funzione onSuccess che fa apparire il messaggio
    onSuccess()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.settore}>{annuncio.settori?.label}</span>
            <h2 className={styles.modalTitolo}>{annuncio.titolo}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Dettagli annuncio */}
        <div className={styles.annuncioInfo}>
          {annuncio.comune && <span> {annuncio.comune}</span>}
          {annuncio.budget && <span> Budget: {annuncio.budget}€</span>}
          {annuncio.urgente && <span className={styles.urgente}>Urgente</span>}
        </div>
        {/* solita condizione: se ha descrizione -> renderizza */}
        {annuncio.descrizione && (
          <p className={styles.annuncioDesc}>{annuncio.descrizione}</p>
        )}

        <div className={styles.divider} />

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Il tuo preventivo (€)</label>
            <input
              className={styles.input}
              name="prezzo"
              type="number"
              placeholder="Es. 250"
              value={form.prezzo}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Messaggio *</label>
            <textarea
              className={styles.textarea}
              name="messaggio"
              placeholder="Presentati e descrivi come puoi aiutare il cliente..."
              value={form.messaggio}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          {errore && <p className={styles.errore}>{errore}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Invio...' : 'Invia offerta'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}