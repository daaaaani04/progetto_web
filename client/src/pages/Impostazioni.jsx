import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Impostazioni.module.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
)

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleRowText}>
        <p className={styles.toggleRowLabel}>{label}</p>
        {sub && <p className={styles.toggleRowSub}>{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function Impostazioni({ sessione, profilo }) {
  const navigate = useNavigate()
  const [tabAttiva, setTabAttiva] = useState('account')

  // Account
  const [email, setEmail]           = useState(sessione?.user?.email || '')
  const [emailMsg, setEmailMsg]     = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pwd, setPwd]               = useState('')
  const [pwdConferma, setPwdConferma] = useState('')
  const [pwdMsg, setPwdMsg]         = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  // Notifiche
  const [notifiche, setNotifiche] = useState({
    nuoveOfferte:  true,
    messaggi:      true,
    aggiornamenti: false,
    newsletter:    false,
  })

  // Privacy
  const [privacy, setPrivacy] = useState({
    profiloVisibile: true,
    mostraTelefono:  false,
    raccoltaDati:    true,
  })

  const [showElimina,setshowElimina] = useState(false)

  const isVenditore  = profilo?.ruolo === 'venditore'
  const isAcquirente = profilo?.ruolo === 'acquirente'
  const nomeDisplay  = isVenditore
    ? (profilo?.nome_azienda || `${profilo?.nome} ${profilo?.cognome}`)
    : `${profilo?.nome} ${profilo?.cognome}`

  const tabs = [
    { id: 'account',    label: 'Account' },
    { id: 'notifiche',  label: 'Notifiche' },
    { id: 'privacy',    label: 'Privacy' },
    { id: 'pericolosa', label: 'Zona pericolosa' },
  ]

  async function handleEmailUpdate(e) {
    e.preventDefault()
    setEmailLoading(true); setEmailMsg(null)
    const { error } = await supabase.auth.updateUser({ email })
    setEmailLoading(false)
    setEmailMsg(error
      ? { tipo: 'errore', testo: error.message }
      : { tipo: 'ok', testo: 'Email aggiornata. Controlla la casella per confermare.' }
    )
  }

  async function handlePwdUpdate(e) {
    e.preventDefault()
    if (pwd !== pwdConferma) { setPwdMsg({ tipo: 'errore', testo: 'Le password non coincidono.' }); return }
    if (pwd.length < 6)      { setPwdMsg({ tipo: 'errore', testo: 'Minimo 6 caratteri.' }); return }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdLoading(false)
    if (error) {
      setPwdMsg({ tipo: 'errore', testo: error.message })
    } else {
      setPwdMsg({ tipo: 'ok', testo: 'Password aggiornata con successo.' })
      setPwd(''); setPwdConferma('')
    }
  }

  async function handleEliminaAccount() {
    // Qui andrà la tua logica di eliminazione definitiva (es. una Edge Function o cancellazione record)
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (!profilo) return <div className={styles.loading}>Caricamento in corso...</div>

  return (
    <div className={styles.pageWrapper}>
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

          {/* Sidebar */}
          <aside className={styles.sidebarMenu}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={tabAttiva === t.id ? styles.activeMenu : ''}
                onClick={() => setTabAttiva(t.id)}
              >
                {t.label}
              </button>
            ))}
          </aside>

          {/* Contenuto */}
          <main className={styles.mainFormArea}>

            {/* ── TAB: ACCOUNT ── */}
            {tabAttiva === 'account' && (
              <>
                <section className={styles.formCard}>
                  <h2 className={styles.sectionTitle}>Indirizzo email</h2>
                  <form onSubmit={handleEmailUpdate}>
                    <div className={styles.gridForm}>
                      <div className={styles.inputGroupFull}>
                        <label>EMAIL</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {emailMsg && (
                      <p className={emailMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                        {emailMsg.testo}
                      </p>
                    )}
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
                    <a
                      href={`/profilo/${profilo?.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.saveBtn}
                      style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                    >
                      Visualizza profilo pubblico →
                    </a>
                  </section>
                )}
              </>
            )}

            {/* ── TAB: NOTIFICHE ── */}
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

            {/* ── TAB: PRIVACY ── */}
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

            {/* ── TAB: ZONA PERICOLOSA ── */}
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