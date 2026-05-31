// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Navbar.module.css'

export default function Navbar({ sessione, profilo }) {
  const [menuAperto, setMenuAperto] = useState(false)
  const [dropdownAperto, setDropdownAperto] = useState(false)
  const dropdownRef = useRef(null)
  const [ConfermaLog, setConfermaLog] = useState(false)

  // quaando la lunghezza è più grande di 768px chiamo setMenuAperto(false) chiude il menu evitando che si rompa
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMenuAperto(false)
    }
    window.addEventListener('resize', handleResize)       
    return () => window.removeEventListener('resize', handleResize) // cleanup
  }, [])

  // gestioen del menu dropdown, se clicco fuori chiudo il dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { // se il dropdown è aperto e clicco fuori, chiudo il dropdown
        setDropdownAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'    /* forzo refresh per resettare (altrimenti resta aperto profilo...) */
  }

  const isVenditore = profilo?.ruolo === 'venditore'
  const isAcquirente = profilo?.ruolo === 'acquirente'

  const linkNav = (
    <>
    {/* chiudo il menu se aperto */}
      <Link className={styles.link} to="/" onClick={() => setMenuAperto(false)}>Home</Link>   

      {/* Venditore vede: Annunci, Preventivi inviati */}
      {isVenditore && (
        <>
          <Link className={styles.link} to="/annunci" onClick={() => setMenuAperto(false)}>Annunci</Link>
          <Link className={styles.link} to="/preventivi" onClick={() => setMenuAperto(false)}>Preventivi inviati</Link>
        </>
      )}

      {/* Acquirente vede: I miei annunci, Preventivi ricevuti */}
      {isAcquirente && (
        <Link className={styles.link} to="/miei-annunci" onClick={() => setMenuAperto(false)}>I miei annunci</Link>
      )}

      {/* se non ho una sessione attiva, vedo solo annunci */}
      {!sessione && (
        <Link className={styles.link} to="/annunci" onClick={() => setMenuAperto(false)}>Annunci</Link>
      )}
    </>
  )

  return (
    <nav className={styles.nav}>
      <Link className={styles.logo} to="/">
        connetti<span className={styles.dot}>.</span>
      </Link>

      {/* Desktop */}
      <div className={styles.links}>
        {linkNav}   {/* variabile che contiene il contenuto della nav condizionale */}
        <div className={styles.divider} />  {/* linea verticale di separazione */}
        {sessione ? (
          <div className={styles.dropdownWrapper} ref={dropdownRef}>  {/* wrapper per dropdown, usato per chiudere il dropdown quando clicco fuori */}
           {/* se aperto -> onClick chiudo, se chiuso onClick apro */}
            <button
              className={`${styles.email} ${styles.emailBtn}`}
              onClick={() => setDropdownAperto(!dropdownAperto)}    
            >
              {sessione.user.email}
              <span className={`${styles.chevron} ${dropdownAperto ? styles.chevronUp : ''}`}>▾</span>
            </button>

            {/* Dropdown email */}
            {dropdownAperto && (
              <div className={styles.dropdown}>
                <Link
                  className={styles.dropdownItem}
                  to={`/profilo/${profilo?.id}/privato`}
                  onClick={() => setDropdownAperto(false)}
                >  
                  Profilo
                </Link>
                <Link
                  className={styles.dropdownItem}
                  to="/impostazioni"
                  onClick={() => setDropdownAperto(false)}
                >
                  Impostazioni
                </Link>
                <Link
                  className={styles.dropdownItem}
                  to="/supporto"
                  onClick={() => setDropdownAperto(false)}
                >
                  Supporto
                </Link>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItemDanger} onClick={() => setConfermaLog(true)}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link className={styles.btnSolid} to="/login">Accedi</Link>
        )}
      </div>


      {/* Hamburger */}
      {/* se menuAperto allora sono in mobile */}
      <button
        className={`${styles.hamburger} ${menuAperto ? styles.open : ''}`} /* se menuAperto è true, aggiungo la classe open che trasforma le 3 linee in una X */
        onClick={() => setMenuAperto(!menuAperto)}
      >
        <span /><span /><span />    {/* 3 linee che vendono implìilate e gli viene aggiunta la transition*/}
      </button>

      {/* Menu mobile */}
      <div className={`${styles.mobileMenu} ${menuAperto ? styles.open : ''}`}>
        {linkNav}
        {sessione ? (
          <>
            <span className={styles.mobileEmail}>{sessione.user.email}</span>
            <Link className={styles.mobileDropdownItem} to={`/profilo/${profilo?.id}/privato`} onClick={() => setMenuAperto(false)}>Profilo</Link>
            <Link className={styles.mobileDropdownItem} to="/impostazioni" onClick={() => setMenuAperto(false)}>Impostazioni</Link>
            <Link className={styles.mobileDropdownItem} to="/supporto" onClick={() => setMenuAperto(false)}>Supporto</Link>
            <button className={styles.btnOutline} onClick={() => setConfermaLog(true)}>Logout</button>
          </>
        ) : (
          <Link className={styles.btnSolid} to="/login" onClick={() => setMenuAperto(false)}>Accedi</Link>
        )}
      </div>
      {ConfermaLog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sei sicuro di voler uscire?</h3>
            <p>Dovrai inserire nuovamente le tue credenziali per accedere.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnAnnulla} onClick={() => setConfermaLog(false)}>
                Annulla
              </button>
              <button className={styles.btnLogoutConfirm} onClick={handleLogout}>
                Esci ora
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}