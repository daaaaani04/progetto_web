// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Home.module.css'



export default function Home() {
  const [settori, setSettori] = useState([])

  // è un hook diir React che esegue side-effect
  useEffect(() => {
    // è una classica query al db che estrae i settori
    // restituisce una promise quindi è necessario il .then() prima di estrarre data (ignoro status...)
    supabase.from('settori').select('*').then(({ data }) => {
      setSettori(data || [])
    })
  }, [])  // lista vuota importante per eseguire una sola volta l'hook


  return (
    <main>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroLabel}>La piattaforma per connettere domanda e offerta</p>
        <h1 className={styles.heroTitle}>
          Pensa a <span className={styles.accent}>cosa fare</span><br />trova chi <span className={styles.accent}>lo fa</span>.
        </h1>
        <p className={styles.heroSub}>
          Pubblica la tua richiesta e ricevi offerte da professionisti verificati nella tua zona. Semplice, veloce, affidabile.
        </p>
        <div className={styles.heroBtns}>
          <Link className={styles.btnPrimary} to="/annunci/nuovo">Pubblica un annuncio</Link>
          <Link className={styles.btnSecondary} to="/annunci">Sfoglia annunci</Link>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.stat} >
          <div className={styles.statNum}>1.2k<span className={styles.accent}>+</span></div>
          <div className={styles.statLabel}>Annunci attivi</div>
        </div>
        <div className={styles.stat} >
          <div className={styles.statNum}>340<span className={styles.accent}>+</span></div>
          <div className={styles.statLabel}>Professionisti</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>98<span className={styles.accent}>%</span></div>
          <div className={styles.statLabel}>Soddisfazione</div>
        </div>
      </section>

      {/* Come funziona */}
      <section className={styles.how}>
        <p className={styles.sectionLabel} >Come funziona</p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>01</div>
            <h3>Pubblica la richiesta</h3>
            <p>Descrivi di cosa hai bisogno, indica la zona e il budget. In pochi minuti sei online.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>02</div>
            <h3>Ricevi le offerte</h3>
            <p>I professionisti del settore vedono la tua richiesta e ti inviano la loro proposta.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>03</div>
            <h3>Scegli il migliore</h3>
            <p>Confronta le offerte ricevute e scegli il professionista più adatto alle tue esigenze.</p>
          </div>
        </div>
      </section>

      {/* Settori */}
      <section className={styles.settori}>
        <p className={styles.sectionLabel} >Settori disponibili</p>
        <div className={styles.settoriGrid}>
            {settori.length > 0 ? settori.map((s, i) => (
                <Link
                className={styles.settoreCard}
                key={s.id}
                to={`/annunci?settore=${s.id}`}
                style={s.immagine ? { backgroundImage: `url(${s.immagine})` } : {}}
                >
                <div className={styles.settoreOverlay} />
                <div className={styles.settoreName}>{s.label}</div>
                </Link>
            )) : (
                ['Idraulica', 'Elettrica', 'Edilizia', 'Giardinaggio'].map((s, i) => (
                <div className={styles.settoreCard} key={s} >
                    <div className={styles.settoreName}>{s}</div>
                </div>
                ))
            )}
            </div>
      </section>

      {/* CTA */}
      <section className={styles.cta} >
        <h2>Sei un professionista e vuoi unirti a noi<span className={styles.accent}>?</span></h2>
        <Link className={styles.btnPrimary} to="/login">Inizia ora</Link>
      </section>

    </main>
  )
}