// src/pages/NuovoAnnuncio.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './NuovoAnnuncio.module.css'

export default function NuovoAnnuncio({ sessione }) {
  const navigate = useNavigate()
  const [settori, setSettori] = useState([])
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)
  const [form, setForm] = useState({
    titolo: '',
    descrizione: '',
    settore_id: '',
    comune: '',
    budget: '',
    urgente: false,
    scade_il: ''
  })

  useEffect(() => {
    supabase.from('settori').select('*').then(({ data }) => {
      setSettori(data || [])
    })
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrore(null)
    setLoading(true)

    const { error } = await supabase
      .from('annunci')
      .insert({
        acquirente_id: sessione.user.id,
        titolo: form.titolo,
        descrizione: form.descrizione || null,
        settore_id: form.settore_id,
        comune: form.comune || null,
        budget: form.budget || null,
        urgente: form.urgente,
        scade_il: form.scade_il || null
      })

    setLoading(false)

    if (error) return setErrore(error.message)
    navigate('/miei-annunci')
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <p className={styles.label}>Nuovo annuncio</p>
          <h1 className={styles.titolo}>Pubblica la tua richiesta<span className={styles.accent}>.</span></h1>
          <p className={styles.sub}>Descrivi di cosa hai bisogno e ricevi offerte dai professionisti della tua zona.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Titolo */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Titolo *</label>
            <input
              className={styles.input}
              name="titolo"
              placeholder="Es. Cerco idraulico per perdita d'acqua"
              value={form.titolo}
              onChange={handleChange}
              required
            />
          </div>

          {/* Descrizione */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Descrizione</label>
            <textarea
              className={styles.textarea}
              name="descrizione"
              placeholder="Descrivi nel dettaglio cosa ti serve, quando e in che condizioni..."
              value={form.descrizione}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {/* Settore */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Settore *</label>
            <select
              className={styles.select}
              name="settore_id"
              value={form.settore_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona un settore</option>
              {settori.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Comune + Budget */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Comune</label>
              <input
                className={styles.input}
                name="comune"
                placeholder="Es. Milano"
                value={form.comune}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Budget (€)</label>
              <input
                className={styles.input}
                name="budget"
                placeholder="Es. 300"
                value={form.budget}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Scade il */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Scade il</label>
            <input
              className={styles.input}
              name="scade_il"
              type="date"
              value={form.scade_il}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Urgente */}
          <div className={styles.checkboxField}>
            <input
              className={styles.checkbox}
              id="urgente"
              name="urgente"
              type="checkbox"
              checked={form.urgente}
              onChange={handleChange}
            />
            <label htmlFor="urgente" className={styles.checkboxLabel}>
              Richiesta urgente
            </label>
          </div>

          {errore && <p className={styles.errore}>{errore}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/miei-annunci')}
            >
              Annulla
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Pubblicazione...' : 'Pubblica annuncio'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}