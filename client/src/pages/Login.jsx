// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  /* Stato per gestire se siamo in modalità registrazione o login, e per memorizzare i dati del form */
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
  const [settoreSelezionato, setSettoreSelezionato] = useState('')
  const [settori, setSettori] = useState([])
  const [nomeAzienda, setNomeAzienda] = useState('')

  /* Recupera i settori dal database quando il componente viene montato */
  useEffect(() => {
    supabase.from('settori').select('*').then(({ data }) => {
      setSettori(data || [])
    })
  }, [])

  /* gestisci iscrizione o registrazione */
  async function handleSubmit(e) {
    e.preventDefault()
    setErrore(null)
    setMessaggio(null)

    if (isRegistrazione) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { ruolo, nome, cognome, telefono, comune, settoreSelezionato, nomeAzienda }
        }
      })
      if (error) {
        console.error(error);
        return setErrore(error.message)
      }
      /* La registrazione è avvenuta con successo */
      setMessaggio('Registrazione completata! Controlla la tua email.')
    } else {
      /* Uso auth.signInWithPassword per il login, che è più semplice e diretto
          Le password non girano mai in chiaro nel senso classico, perché Supabase gestisce l'autenticazione internamente:
          supabase.auth.signInWithPassword({ email, password }) — la password viene inviata via HTTPS a Supabase, che la hasha lato server. Non la tocchi mai tu.
          Il client riceve un JWT (json web token) access token, non la password.
          Il token viene salvato in localStorage o cookie (configurabile). */
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setErrore(error.message)
    }
  }

  /* Cambia tra modalità registrazione e login, e resetta eventuali messaggi di errore o successo */
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
          {isRegistrazione ? 'Crea il tuo account su connetti.' : 'Bentornato su connetti.'}
        </p>
       {/* ho email e password in entrambi i casi quindi no rendering condizionato */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)} /* Uso un tipico event handler di react: e (evento) -> fai qualcosa */
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

              {/* se il ruolo è un venditore -> setRuolo -> fai apparire nuovi elementi */}
              {ruolo === 'venditore' && (   
                <input
                className={styles.input}
                placeholder="Nome Azienda"
                value={nomeAzienda}
                onChange={e => setNomeAzienda(e.target.value)}>
                </input>
              )}


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
          {/* Mostra eventuali messaggi di errore (password corta...) o successo */}
          {errore && <p className={styles.errore}>{errore}</p>}
          {messaggio && <p className={styles.messaggio}>{messaggio}</p>}

          <button className={styles.btnPrimary} type="submit">
            {isRegistrazione ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isRegistrazione ? 'Hai già un account? ' : 'Non hai un account? '}
          <button className={styles.btnLink} onClick={handleToggle}> {/* Uso un button con stile link per cambiare modalità, invece di un semplice a, perché non voglio ricaricare la pagina */}
            {isRegistrazione ? 'Accedi' : 'Registrati'}
          </button>
        </p>
      </div>
    </div>
  )
}