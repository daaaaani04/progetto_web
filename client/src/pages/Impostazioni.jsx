import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' //hook per navigare tra le pagine
import supabase from '../lib/supabase'
import styles from './Impostazioni.module.css'

//componente react che implementa la pagina impostazioni del sito

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <line x1="19" y1="12" x2="5" y2="12"></line> {/* linea orizzontale */}
    <polyline points="12 19 5 12 12 5"></polyline> {/* punta della freccia */}
  </svg>
)

//definisce un componente per l'interruttore a scorrimento (tipico di notifiche)
// riceve in input un booleano checked che indica se è acceso o spento e onChange cioè la funzione da chiamare quando viene cliccato
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"  //dice che è un interruttore
      aria-checked={checked} //comunica lo stato attuale
      onClick={() => onChange(!checked)} // al click chiama la onchange invertendo lo stato attuale
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} // assegna la classe attuale e se checked è vero assegna la classe per lo stato attivo
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

//definisce la riga in cui è presente il toggle, prende in input il label ( cioè il titolo), 
function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleRowText}>
        <p className={styles.toggleRowLabel}>{label}</p>
        {/* se è stata passata una descrizione (sub è un booleano) la mostra  */}
        {sub && <p className={styles.toggleRowSub}>{sub}</p>}
      </div>

      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
//esporta il componente principale della pagina, ricevendo come props 'sessione' e profilo
export default function Impostazioni({ sessione, profilo }) {
  const navigate = useNavigate() //inizializza la funzione di navigazione per tornare indietoro
  const [tabAttiva, setTabAttiva] = useState('account') //stato per tracciare quale sezione è visibile, inizializzata con la sezione account

  /* stati della sezione account:
  - email: inizializza l'email prendendola dalla sessione o stringa vuota se non la trova
  - stato per mostrare successo o errore nel caso di cambio email
  - stato per gestire il caricamento durante il cambio email
  - stato per la nuova password in caso si voglia cambiarla 
  - stato per confermare il cambio passwors 
  - stato per mostrare successo o rifiuto nel caso si cambi password 
  - stato per gestire il caricamento durante il cambio password 
  */
  const [email, setEmail]           = useState(sessione?.user?.email || '')
  const [emailMsg, setEmailMsg]     = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pwd, setPwd]               = useState('')
  const [pwdConferma, setPwdConferma] = useState('')
  const [pwdMsg, setPwdMsg]         = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  /* stati per la sezione notifiche:
  - stato unico per gestire tutti i toggle delle notifiche: inziializzato a un dizionario che ha true true false false
  */
  const [notifiche, setNotifiche] = useState({
    nuoveOfferte:  true,
    messaggi:      true,
    aggiornamenti: false,
    newsletter:    false,
  })

  /* stato unico per la sezione privacy che raccoglie le info sui toggle di questa sezione, inizializzato col primo e terzo toggle accesi */
  const [privacy, setPrivacy] = useState({
    profiloVisibile: true,
    mostraTelefono:  false,
    raccoltaDati:    true,
  })

  // stato per mostrare il modale per eliminare l'account
  const [showElimina,setshowElimina] = useState(false)

  // booleani per identificare se il profilo è acquirente o venditore 
  const isVenditore  = profilo?.ruolo === 'venditore'
  const isAcquirente = profilo?.ruolo === 'acquirente'
  // nome display per salvare il nome del profilo da mostrare in alto a destra nella card (se è venditore nome azienda)
  const nomeDisplay  = isVenditore
    ? (profilo?.nome_azienda|| `${profilo?.nome} ${profilo?.cognome}`)
    : `${profilo?.nome} ${profilo?.cognome}` 

  //array che definisce le sezioni presenti nel menu laterale 
  const tabs = [
    { id: 'account',    label: 'Account' },
    { id: 'notifiche',  label: 'Notifiche' },
    { id: 'privacy',    label: 'Privacy' },
    { id: 'pericolosa', label: 'Zona pericolosa' },
  ]

  // funzione chiamata al sumbit del form per aggiornare l'email
  async function handleEmailUpdate(e) {
    e.preventDefault() //fa in modo che non venga ricaricata la pagina a causa del form
    setEmailLoading(true); setEmailMsg(null) //attiva il caricamento dell'email e mette a null il mess per notificare
    const { error } = await supabase.auth.updateUser({ email }) //email 
    setEmailLoading(false) 
    setEmailMsg(error
      ? { tipo: 'errore', testo: error.message }
      : { tipo: 'ok', testo: 'Email aggiornata. Controlla la casella per confermare.' }
    )
    // fa rendering condizionale e mostra l'esito della situa
  }

  //funzione chiamata al sumbit del form per aggiornare la password
  async function handlePwdUpdate(e) {
    e.preventDefault()
    //controlli lato client se è stato inserito tutto correttamente
    if (pwd !== pwdConferma) { setPwdMsg({ tipo: 'errore', testo: 'Le password non coincidono.' }); return }
    if (pwd.length < 6)      { setPwdMsg({ tipo: 'errore', testo: 'Minimo 6 caratteri.' }); return }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdLoading(false)
    if (error) {
      setPwdMsg({ tipo: 'errore', testo: error.message })
    } else {
      setPwdMsg({ tipo: 'ok', testo: 'Password aggiornata con successo.' })
      setPwd(''); setPwdConferma('') //se tutto funziona mette stringa vuota in tutto
    }
  }

  // funzione per la gestione dell'eliminazione account (per praticità disconnettiamo)

  async function handleEliminaAccount() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  //se i dati del profilo non sono stati acnora caricati  mette in caricamento
  if (!profilo) return <div className={styles.loading}>Caricamento in corso...</div>

  return (
    //div principale che contiene tutta la pag
    <div className={styles.pageWrapper}>
      {/* div che fa da card per la pagina */}
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              <BackIcon />
            </button>
            <h1 className={styles.navTitle}>Impostazioni</h1>
          </div>
          <div className={styles.userDropdown}>
            <span>{nomeDisplay}</span>
            <div className={styles.miniAvatar}>
              {nomeDisplay?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className={styles.contentLayout}>

          {/* aside usato per le barre laterali*/}
          <aside className={styles.sidebarMenu}>
            {tabs.map(t => (
              <button
                key={t.id}
                //se questo tab è quello attivo nello stato dagli lo style active
                className={tabAttiva === t.id ? styles.activeMenu : ''}
                onClick={() => setTabAttiva(t.id)}
              >
                {t.label}
              </button>
            ))}
          </aside>

          {/* Contenuto */}
          <main className={styles.mainFormArea}>

            {/* TAB: ACCOUNT */}
            {tabAttiva === 'account' && (
              <>
                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Indirizzo email</h2>
                  <form onSubmit={handleEmailUpdate}>
                    <div className={styles.gridForm}>
                      <div className={styles.inputGroupFull}>
                        <label>EMAIL</label>
                        <input
                          //scrivendo type = email il browser sa che ci deve essere una email 
                          type="email" 
                          value={email}
                          //il testo contentuo nella casella bianca è quello contenuto nella var di stato email
                          onChange={e => setEmail(e.target.value)}
                          //ogni volta che l'utente scrive qualcosa aggiorna la var di stato email
                          required
                          // fa si che il bottone per essere cliccato deve esserci scritto quaclosa qui
                        />
                      </div>
                    </div>
                    {emailMsg && (
                      <p className={emailMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                        {emailMsg.testo}
                      </p>
                    )}
                    {/* buttone di salvaatggio, disabilitato se emailLoading è true */}
                    <button type="submit" className={styles.saveBtn} disabled={emailLoading}>
                      {emailLoading ? 'Aggiornamento…' : 'Aggiorna email'}
                    </button>
                  </form>
                </section>

                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Cambia password</h2>
                  <form onSubmit={handlePwdUpdate}>
                    <div className={styles.gridForm}>
                      <div className={styles.inputGroup}>
                        <label>NUOVA PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Minimo 6 caratteri"
                          value={pwd}
                          onChange={e => setPwd(e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>CONFERMA PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Ripeti la nuova password"
                          value={pwdConferma}
                          onChange={e => setPwdConferma(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {pwdMsg && (
                      <p className={pwdMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                        {pwdMsg.testo}
                      </p>
                    )}
                    <button type="submit" className={styles.saveBtnGhost} disabled={pwdLoading}>
                      {pwdLoading ? 'Aggiornamento…' : 'Aggiorna password'}
                    </button>
                  </form>
                </section>

                {isVenditore && (
                  <section className={styles.formCard}>
                    <h2 className={styles.sectionTitle}>Profilo pubblico</h2>
                    <p className={styles.cardDesc}>
                      Questa è la pagina che vedono i potenziali clienti nel tuo settore.
                    </p>
                    <Link
                      to={`/profilo/${profilo?.id}`}
                      className={styles.saveBtn}
                      style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                    >
                      Visualizza profilo pubblico →
                    </Link>
                  </section>
                )}
              </>
            )}

            {/* TAB: NOTIFICHE */}
            {tabAttiva === 'notifiche' && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Notifiche email</h2>
                <div className={styles.toggleList}>
                  {isVenditore && (
                    <ToggleRow
                      label="Nuove offerte"
                      sub="Ricevi un'email quando un cliente pubblica un annuncio nel tuo settore"
                      checked={notifiche.nuoveOfferte}
                      onChange={v => setNotifiche(p => ({ ...p, nuoveOfferte: v }))}
                    />
                  )}
                  {isAcquirente && (
                    <ToggleRow
                      label="Nuovi preventivi"
                      sub="Ricevi un'email quando un venditore risponde al tuo annuncio"
                      checked={notifiche.nuoveOfferte}
                      onChange={v => setNotifiche(p => ({ ...p, nuoveOfferte: v }))}
                    />
                  )}
                  <ToggleRow
                    label="Messaggi"
                    sub="Notifiche per i nuovi messaggi ricevuti"
                    checked={notifiche.messaggi}
                    onChange={v => setNotifiche(p => ({ ...p, messaggi: v }))}
                  />
                  <ToggleRow
                    label="Aggiornamenti piattaforma"
                    sub="Novità e miglioramenti di connetti."
                    checked={notifiche.aggiornamenti}
                    onChange={v => setNotifiche(p => ({ ...p, aggiornamenti: v }))}
                  />
                  <ToggleRow
                    label="Newsletter"
                    sub="Consigli e best practice per usare la piattaforma"
                    checked={notifiche.newsletter}
                    onChange={v => setNotifiche(p => ({ ...p, newsletter: v }))}
                  />
                </div>
                <button className={styles.saveBtn} style={{ marginTop: 24 }}>
                  Salva preferenze
                </button>
              </section>
            )}

            {/*  TAB: PRIVACY */}
            {tabAttiva === 'privacy' && (
              <>
                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Visibilità</h2>
                  <div className={styles.toggleList}>
                    {isVenditore && (
                      <ToggleRow
                        label="Profilo visibile"
                        sub="Il tuo profilo appare nei risultati di ricerca"
                        checked={privacy.profiloVisibile}
                        onChange={v => setPrivacy(p => ({ ...p, profiloVisibile: v }))}
                      />
                    )}
                    <ToggleRow
                      label="Mostra numero di telefono"
                      sub="Il numero di telefono è visibile sul tuo profilo"
                      checked={privacy.mostraTelefono}
                      onChange={v => setPrivacy(p => ({ ...p, mostraTelefono: v }))}
                    />
                  </div>
                </section>

                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Dati</h2>
                  <div className={styles.toggleList}>
                    <ToggleRow
                      label="Raccolta dati analitici"
                      sub="Aiutaci a migliorare condividendo dati anonimi di utilizzo"
                      checked={privacy.raccoltaDati}
                      onChange={v => setPrivacy(p => ({ ...p, raccoltaDati: v }))}
                    />
                  </div>
                  <button className={styles.saveBtn} style={{ marginTop: 24 }}>
                    Salva preferenze
                  </button>
                </section>
              </>
            )}

            {/*  TAB: ZONA PERICOLOSA */}
            {tabAttiva === 'pericolosa' && (
              <>
                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Disconnetti account</h2>
                  <p className={styles.cardDesc}>
                    Esci da tutti i dispositivi. Dovrai effettuare nuovamente l'accesso.
                  </p>
                  <button
                    className={styles.saveBtnGhost}
                    onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
                  >
                    Disconnetti
                  </button>
                </section>

                <section className={`${styles.formCard} ${styles.formCardDanger}`}>
                  <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDanger}`}>
                    Elimina account
                  </h2>
                  <p className={styles.cardDesc}>
                    Elimina definitivamente il tuo account e tutti i dati associati.
                    Questa operazione è <strong>irreversibile</strong>.
                  </p>
                  <button
                    className={styles.saveBtnDanger}
                    onClick={ () => setshowElimina(true) }
                  >
                    Elimina account
                  </button>
                </section>
              </>
            )}

          </main>
        </div>
      </div>
      {showElimina && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sei assolutamente sicuro?</h3>
            <p>Non potrai più recuperare i tuoi dati dopo questa operazione.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnAnnulla} onClick={() => setshowElimina(false)}>
                Annulla
              </button>
              <button className={styles.btnEliminaConfirm} onClick={handleEliminaAccount}>
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}