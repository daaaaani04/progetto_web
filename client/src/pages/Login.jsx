// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  const [isRegistrazione, setIsRegistrazione] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [comune, setComune] = useState('')
  const [ruolo, setRuolo] = useState('acquirente')
  const [errore, setErrore] = useState(null)
  const [messaggio, setMessaggio] = useState(null)
  const [partitaIva, setPartitaIva] = useState('')
  const [settoreSelezionato, setSettoreSelezionato] = useState('')

  const [settori, setSettori] = useState([])

  useEffect(() => {
    supabase.from('settori').select('*').then(({ data }) => {
      setSettori(data || [])
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrore(null)
    setMessaggio(null)

    if (isRegistrazione) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { ruolo, nome, cognome, telefono, comune, settoreSelezionato }
        }
      })
      if (error) {
        console.error(error);
        return setErrore(error.message)
      }
      setMessaggio('Registrazione completata! Controlla la tua email.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setErrore(error.message)
    }
  }

  function handleToggle() {
    setIsRegistrazione(!isRegistrazione)
    setErrore(null)
    setMessaggio(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.titolo}>
          {isRegistrazione ? 'Registrati' : 'Accedi'}
        </h1>
        <p className={styles.sottotitolo}>
          {isRegistrazione
            ? 'Crea il tuo account su connetti.'
            : 'Bentornato su connetti.'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {isRegistrazione && (
            <>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  placeholder="Cognome"
                  value={cognome}
                  onChange={e => setCognome(e.target.value)}
                  required
                />
              </div>
              <input
                className={styles.input}
                placeholder="Telefono (opzionale)"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Comune (opzionale)"
                value={comune}
                onChange={e => setComune(e.target.value)}
              />
              <select
                className={styles.select}
                value={ruolo}
                onChange={e => setRuolo(e.target.value)}
              >
                <option value="acquirente">Acquirente</option>
                <option value="venditore">Venditore</option>
              </select>

              {ruolo === 'venditore' && (
                <select
                  className={styles.select}
                  name="settore_id"
                  value={settoreSelezionato}    
                  onChange= {e => setSettoreSelezionato(e.target.value)}
                  >
                  <option value="">Tutti i settori</option>
                  {settori.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              )}
            </>
          )}

          {errore && <p className={styles.errore}>{errore}</p>}
          {messaggio && <p className={styles.messaggio}>{messaggio}</p>}

          <button className={styles.btnPrimary} type="submit">
            {isRegistrazione ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isRegistrazione ? 'Hai già un account? ' : 'Non hai un account? '}
          <button className={styles.btnLink} onClick={handleToggle}>
            {isRegistrazione ? 'Accedi' : 'Registrati'}
          </button>
        </p>
      </div>
    </div>
  )
}