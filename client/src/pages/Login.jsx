// client/src/pages/Login.jsx
import { useState } from 'react'
import supabase from '../lib/supabase'

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

  async function handleSubmit(e) {
    e.preventDefault()
    setErrore(null)
    setMessaggio(null)

    if (isRegistrazione) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { ruolo, nome, cognome, telefono, comune }
        }
      })
      if (error) return setErrore(error.message)
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
    <div>
      <h1>{isRegistrazione ? 'Registrati' : 'Accedi'}</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {isRegistrazione && (
          <>
            <input
              placeholder="Nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
            <input
              placeholder="Cognome"
              value={cognome}
              onChange={e => setCognome(e.target.value)}
              required
            />
            <input
              placeholder="Telefono (opzionale)"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
            <input
              placeholder="Comune (opzionale)"
              value={comune}
              onChange={e => setComune(e.target.value)}
            />
            <select value={ruolo} onChange={e => setRuolo(e.target.value)}>
              <option value="acquirente">Acquirente</option>
              <option value="venditore">Venditore</option>
            </select>
          </>
        )}

        {errore && <p style={{ color: 'red' }}>{errore}</p>}
        {messaggio && <p style={{ color: 'green' }}>{messaggio}</p>}

        <button type="submit">
          {isRegistrazione ? 'Registrati' : 'Accedi'}
        </button>
      </form>

      <p>
        {isRegistrazione ? 'Hai già un account? ' : 'Non hai un account? '}
        <button onClick={handleToggle}>
          {isRegistrazione ? 'Accedi' : 'Registrati'}
        </button>
      </p>
    </div>
  )
}