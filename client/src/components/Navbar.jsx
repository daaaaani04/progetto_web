// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Navbar.module.css'

export default function Navbar({ sessione, profilo }) {
  const [menuAperto, setMenuAperto] = useState(false)

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMenuAperto(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuAperto(false)
  }

  const isVenditore = profilo?.ruolo === 'venditore'
  const isAcquirente = profilo?.ruolo === 'acquirente'

  const linkNav = (
    <>
      <Link className={styles.link} to="/" onClick={() => setMenuAperto(false)}>Home</Link>

      {/* visibile solo ai venditori */}
      {isVenditore && (
        <>
          <Link className={styles.link} to="/annunci" onClick={() => setMenuAperto(false)}>Annunci</Link>
          <Link className={styles.link} to="/preventivi" onClick={() => setMenuAperto(false)}>Preventivi inviati</Link>
        </>
      )}

      {/* visibile solo agli acquirenti */}
      {isAcquirente && (
        <Link className={styles.link} to="/miei-annunci" onClick={() => setMenuAperto(false)}>I miei annunci</Link>
      )}

      {/* visibile a tutti se non loggati */}
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
        {linkNav}
        <div className={styles.divider} />
        {sessione ? (
          <>
            <span className={styles.email}>{sessione.user.email}</span>
            <button className={styles.btnOutline} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link className={styles.btnSolid} to="/login">Accedi</Link>
        )}
      </div>

      {/* Hamburger */}
      <button className={styles.hamburger} onClick={() => setMenuAperto(!menuAperto)}>
        <span /><span /><span />
      </button>

      {/* Menu mobile */}
      <div className={`${styles.mobileMenu} ${menuAperto ? styles.open : ''}`}>
        {linkNav}
        {sessione ? (
          <>
            <span className={styles.mobileEmail}>{sessione.user.email}</span>
            <button className={styles.btnOutline} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link className={styles.btnSolid} to="/login" onClick={() => setMenuAperto(false)}>Accedi</Link>
        )}
      </div>
    </nav>
  )
}