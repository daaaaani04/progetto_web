// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <span className={styles.logo}>connetti<span className={styles.dot}>.</span></span>
      </div>

      <div className={styles.social}>
        <span className={styles.socialTitle}>Social</span>
        <div className={styles.socialLinks}>
          <a className={styles.socialBtn} href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            IG
          </a>
          <a className={styles.socialBtn} href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            FB
          </a>
          <a className={styles.socialBtn} href="https://x.com" target="_blank" rel="noopener noreferrer">
            X
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} connetti. Tutti i diritti riservati.</span>
      </div>
    </footer>
  )
}