import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import FormRecensione from '../components/FormRecensione'
import styles from './ProfiloAzienda.module.css'

export default function ProfiloAzienda({ sessione }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [profilo, setProfilo] = useState(null)
  const [recensioni, setRecensioni] = useState([])
  const [puoRecensire, setPuoRecensire] = useState(false)
  const [haGiaRecensito, setHaGiaRecensito] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tabAttiva, setTabAttiva] = useState('recensioni')

  useEffect(() => {
    caricaTutto()
  }, [id, sessione])

  async function caricaTutto() {
    setLoading(true)

    // Carica profilo con join settori
    const { data: p } = await supabase
      .from('profiles')
      .select(`
        id, nome, cognome, nome_azienda, comune, settore, telefono, created_at,
        settori ( id, label, icona, immagine )
      `)
      .eq('id', id)
      .single()

    // Carica recensioni
    const { data: r } = await supabase
      .from('recensioni')
      .select(`
        id, stelle, testo, created_at,
        profiles!acquirente_id (nome, cognome)
      `)
      .eq('venditore_id', id)
      .order('created_at', { ascending: false })

    setProfilo(p)
    setRecensioni(r || [])

    // Controlla se l'utente loggato può lasciare recensione
    if (sessione) {
      // Step 1: prendi gli id degli annunci dell'acquirente
      const { data: annunciUtente } = await supabase
        .from('annunci')
        .select('id')
        .eq('acquirente_id', sessione.user.id)

      const annunciIds = (annunciUtente || []).map(a => a.id)

      if (annunciIds.length > 0) {
        // Step 2: cerca offerta accettata da questo venditore su quegli annunci
        const { data: offertaAccettata } = await supabase
          .from('offerte')
          .select('id')
          .eq('venditore_id', id)
          .eq('stato', 'accettata')
          .in('annuncio_id', annunciIds)
          .maybeSingle()

        if (offertaAccettata) {
          setPuoRecensire(true)

          // Step 3: controlla se ha già recensito
          const { data: recensioneEsistente } = await supabase
            .from('recensioni')
            .select('id')
            .eq('venditore_id', id)
            .eq('acquirente_id', sessione.user.id)
            .maybeSingle()

          setHaGiaRecensito(!!recensioneEsistente)
        }
      }
    }

    setLoading(false)
  }

  function onRecensioneInviata(nuova) {
    setRecensioni(prev => [nuova, ...prev])
    setHaGiaRecensito(true)
  }

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.spinner} />
      <p>Caricamento profilo...</p>
    </div>
  )

  if (!profilo) return (
    <div className={styles.notFound}>
      <p>Profilo non trovato.</p>
      <button onClick={() => navigate(-1)}>← Torna indietro</button>
    </div>
  )

  const nomeDisplay = profilo.nome_azienda || `${profilo.nome} ${profilo.cognome}`
  const iniziale = nomeDisplay[0]?.toUpperCase()
  const mediaStelle = recensioni.length
    ? (recensioni.reduce((acc, r) => acc + r.stelle, 0) / recensioni.length)
    : null
  const mesiAttivo = Math.floor((Date.now() - new Date(profilo.created_at)) / (1000 * 60 * 60 * 24 * 30))

  return (
    <main className={styles.page}>

      {/* Hero con immagine settore come sfondo */}
      <div
        className={styles.hero}
      >
        <div className={styles.heroInner}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Indietro
          </button>

          <div className={styles.heroCard}>

            <div className={styles.heroInfo}>
              <div className={styles.heroTop}>
                <div>
                  <h1 className={styles.nomeAzienda}>{nomeDisplay}</h1>
                  {profilo.nome_azienda && (
                    <p className={styles.titolare}>
                      {profilo.nome} {profilo.cognome}
                    </p>
                  )}
                </div>
                {mediaStelle && (
                  <div className={styles.ratingBadge}>
                    <span className={styles.ratingNum}>{mediaStelle.toFixed(1)}</span>
                    <span className={styles.stellaGrande}>★</span>
                  </div>
                )}
              </div>

              <div className={styles.heroMeta}>
                {profilo.comune && (
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>📍</span>
                    {profilo.comune}
                  </span>
                )}
                {profilo.settori && (
                  <span className={styles.metaItem}>
                    
                    {profilo.settori.label}
                  </span>
                )}
                {profilo.telefono && (
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>📞</span>
                    {profilo.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{recensioni.length}</span>
              <span className={styles.statLabel}>Recensioni</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>
                {mediaStelle ? mediaStelle.toFixed(1) : '—'}
              </span>
              <span className={styles.statLabel}>Media stelle</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>
                {recensioni.filter(r => r.stelle >= 4).length}
              </span>
              <span className={styles.statLabel}>Recensioni positive</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>{mesiAttivo}</span>
              <span className={styles.statLabel}>Mesi attivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Contatti</h3>
            {profilo.telefono ? (
              <a href={`tel:${profilo.telefono}`} className={styles.contactBtn}>
                📞 Chiama ora
              </a>
            ) : (
              <p className={styles.noContact}>Telefono non disponibile</p>
            )}
          </div>

          {/* Distribuzione stelle */}
          {recensioni.length > 0 && (
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Distribuzione voti</h3>
              {[5, 4, 3, 2, 1].map(n => {
                const count = recensioni.filter(r => r.stelle === n).length
                const perc = Math.round((count / recensioni.length) * 100)
                return (
                  <div key={n} className={styles.barRow}>
                    <span className={styles.barLabel}>{n}★</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </aside>

        {/* Contenuto principale */}
        <div className={styles.main}>

          {/* Tab */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tabAttiva === 'recensioni' ? styles.tabAttiva : ''}`}
              onClick={() => setTabAttiva('recensioni')}
            >
              Recensioni ({recensioni.length})
            </button>
            {puoRecensire && !haGiaRecensito && (
              <button
                className={`${styles.tab} ${tabAttiva === 'lascia' ? styles.tabAttiva : ''}`}
                onClick={() => setTabAttiva('lascia')}
              >
                ✍️ Lascia recensione
              </button>
            )}
          </div>

          {tabAttiva === 'recensioni' && (
            <div className={styles.recensioniList}>
              {haGiaRecensito && (
                <div className={styles.giaRecensito}>
                  ✅ Hai già lasciato una recensione per questa azienda.
                </div>
              )}

              {recensioni.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyIcon}>💬</p>
                  <p>Nessuna recensione ancora.</p>
                  <p className={styles.emptySub}>Sii il primo a lasciare un feedback!</p>
                </div>
              ) : (
                recensioni.map(r => (
                  <div key={r.id} className={styles.recensioneCard}>
                    <div className={styles.recensioneTop}>
                      <div className={styles.recensioneAutore}>
                        <div className={styles.recensioneAvatar}>
                          {r.profiles?.nome?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.recensioneNome}>
                            {r.profiles?.nome} {r.profiles?.cognome}
                          </p>
                          <p className={styles.recensioneData}>
                            {new Date(r.created_at).toLocaleDateString('it-IT', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={styles.stelle}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={n <= r.stelle ? styles.stellaPiena : styles.stellaVuota}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {r.testo && <p className={styles.recensioneTesto}>{r.testo}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {tabAttiva === 'lascia' && puoRecensire && !haGiaRecensito && (
            <FormRecensione
              venditoreid={id}
              sessione={sessione}
              onInviata={onRecensioneInviata}
            />
          )}
        </div>
      </div>
    </main>
  )
}