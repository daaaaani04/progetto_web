// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Navbar.module.css'

export default function Navbar({ sessione, profilo }) {
  const [menuAperto, setMenuAperto] = useState(false)
  const [dropdownAperto, setDropdownAperto] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMenuAperto(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuAperto(false)
    setDropdownAperto(false)
  }

  const isVenditore = profilo?.ruolo === 'venditore'
  const isAcquirente = profilo?.ruolo === 'acquirente'

  const linkNav = (
    <>
      <Link className={styles.link} to="/" onClick={() => setMenuAperto(false)}>Home</Link>

      {isVenditore && (
        <>
          <Link className={styles.link} to="/annunci" onClick={() => setMenuAperto(false)}>Annunci</Link>
          <Link className={styles.link} to="/preventivi" onClick={() => setMenuAperto(false)}>Preventivi inviati</Link>
        </>
      )}

      {isAcquirente && (
        <Link className={styles.link} to="/miei-annunci" onClick={() => setMenuAperto(false)}>I miei annunci</Link>
      )}

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
          <div className={styles.dropdownWrapper} ref={dropdownRef}>
            <button
              className={`${styles.email} ${styles.emailBtn}`}
              onClick={() => setDropdownAperto(!dropdownAperto)}
              aria-expanded={dropdownAperto}
            >
              {sessione.user.email}
              <span className={`${styles.chevron} ${dropdownAperto ? styles.chevronUp : ''}`}>▾</span>
            </button>

            {dropdownAperto && (
              <div className={styles.dropdown}>
                <Link
                  className={styles.dropdownItem}
                  to={`/profilo/${profilo?.id}`}
                  onClick={() => setDropdownAperto(false)}
                >
                  <span className={styles.dropdownIcon}></span>
                  Profilo
                </Link>
                <Link
                  className={styles.dropdownItem}
                  to="/impostazioni"
                  onClick={() => setDropdownAperto(false)}
                >
                  <span className={styles.dropdownIcon}></span>
                  Impostazioni
                </Link>
                <Link
                  className={styles.dropdownItem}
                  to="/supporto"
                  onClick={() => setDropdownAperto(false)}
                >
                  <span className={styles.dropdownIcon}></span>
                  Supporto
                </Link>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItemDanger} onClick={handleLogout}>
                  <span className={styles.dropdownIcon}></span>
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
      <button
        className={`${styles.hamburger} ${menuAperto ? styles.open : ''}`}
        onClick={() => setMenuAperto(!menuAperto)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* Menu mobile */}
      <div className={`${styles.mobileMenu} ${menuAperto ? styles.open : ''}`}>
        {linkNav}
        {sessione ? (
          <>
            <span className={styles.mobileEmail}>{sessione.user.email}</span>
            <Link className={styles.mobileDropdownItem} to={`/profilo/${profilo?.id}`} onClick={() => setMenuAperto(false)}>Profilo</Link>
            <Link className={styles.mobileDropdownItem} to="/impostazioni" onClick={() => setMenuAperto(false)}>Impostazioni</Link>
            <Link className={styles.mobileDropdownItem} to="/supporto" onClick={() => setMenuAperto(false)}>Supporto</Link>
            <button className={styles.btnOutline} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link className={styles.btnSolid} to="/login" onClick={() => setMenuAperto(false)}>Accedi</Link>
        )}
      </div>
    </nav>
  )
}