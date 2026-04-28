// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Navbar.module.css'

export default function Navbar({ sessione }) {
  const [menuAperto, setMenuAperto] = useState(false)

  // Chiude il menu se si allarga la finestra oltre il breakpoint
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setMenuAperto(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuAperto(false)
  }

  return (
    <nav className={styles.nav}>
      <Link className={styles.logo} to="/">
        connetti<span className={styles.dot}>.</span>
      </Link>

      {/* Desktop */}
      <div className={styles.links}>
        <Link className={styles.link} to="/">Home</Link>
        <Link className={styles.link} to="/annunci">Annunci</Link>
        {sessione && (
          <Link className={styles.link} to="/offerte">Le mie offerte</Link>
        )}
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
      <button
        className={styles.hamburger}
        onClick={() => setMenuAperto(!menuAperto)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Menu mobile */}
      <div className={`${styles.mobileMenu} ${menuAperto ? styles.open : ''}`}>
        <Link className={styles.link} to="/" onClick={() => setMenuAperto(false)}>Home</Link>
        <Link className={styles.link} to="/annunci" onClick={() => setMenuAperto(false)}>Annunci</Link>
        {sessione && (
          <Link className={styles.link} to="/offerte" onClick={() => setMenuAperto(false)}>Le mie offerte</Link>
        )}
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