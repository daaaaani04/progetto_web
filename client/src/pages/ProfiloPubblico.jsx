import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import FormRecensione from '../components/FormRecensione'
import styles from './ProfiloPubblico.module.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
)

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function RecensioneCard({ r }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 18px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className={styles.miniAvatar} style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
          {r.profiles?.nome?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', margin: '0 0 2px', fontFamily: 'Lora, serif' }}>
            {r.profiles?.nome} {r.profiles?.cognome}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text)', margin: 0 }}>
            {new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ color: n <= r.stelle ? 'var(--accent)' : 'var(--border)', fontSize: 14 }}>★</span>
          ))}
        </div>
      </div>
      {r.testo && (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, paddingTop: 10, borderTop: '1px solid var(--border)', fontFamily: 'Lora, serif' }}>
          {r.testo}
        </p>
      )}
    </div>
  )
}

export default function ProfiloPubblico({ sessione }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [profilo, setProfilo]               = useState(null)
  const [recensioni, setRecensioni]         = useState([])
  const [puoRecensire, setPuoRecensire]     = useState(false)
  const [haGiaRecensito, setHaGiaRecensito] = useState(false)
  const [loading, setLoading]               = useState(true)
  const [tabAttiva, setTabAttiva]           = useState('recensioni')

  useEffect(() => { caricaTutto() }, [id, sessione])

  async function caricaTutto() {
    setLoading(true)

    const { data: p } = await supabase
      .from('profiles')
      .select('id, nome, cognome, nome_azienda, comune, telefono, created_at, settori(id, label, icona)')
      .eq('id', id)
      .single()

    const { data: r } = await supabase
      .from('recensioni')
      .select('id, stelle, testo, created_at, profiles!acquirente_id(nome, cognome)')
      .eq('venditore_id', id)
      .order('created_at', { ascending: false })

    setProfilo(p)
    setRecensioni(r || [])

    if (sessione) {
      const { data: annunci } = await supabase
        .from('annunci').select('id').eq('acquirente_id', sessione.user.id)
      const ids = (annunci || []).map(a => a.id)
      if (ids.length > 0) {
        const { data: offerta } = await supabase
          .from('offerte').select('id')
          .eq('venditore_id', id).eq('stato', 'accettata').in('annuncio_id', ids).maybeSingle()
        if (offerta) {
          setPuoRecensire(true)
          const { data: esiste } = await supabase
            .from('recensioni').select('id')
            .eq('venditore_id', id).eq('acquirente_id', sessione.user.id).maybeSingle()
          setHaGiaRecensito(!!esiste)
        }
      }
    }

    setLoading(false)
  }

  function onRecensioneInviata(nuova) {
    setRecensioni(prev => [nuova, ...prev])
    setHaGiaRecensito(true)
    setTabAttiva('recensioni')
  }

  if (loading) return <div className={styles.loading}>Caricamento in corso...</div>
  if (!profilo) return <div className={styles.loading}>Profilo non trovato.</div>

  const nome  = profilo.nome_azienda || `${profilo.nome} ${profilo.cognome}`
  const media = recensioni.length
    ? recensioni.reduce((a, r) => a + r.stelle, 0) / recensioni.length
    : null
  const mesi  = Math.floor((Date.now() - new Date(profilo.created_at)) / (1000*60*60*24*30))

  const tabs = [
    { id: 'info',       label: 'Informazioni' },
    { id: 'recensioni', label: `Recensioni${recensioni.length > 0 ? ` (${recensioni.length})` : ''}` },
    ...(puoRecensire && !haGiaRecensito ? [{ id: 'lascia', label: '✍️ Lascia recensione' }] : []),
  ]

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        {/* Header identico a ProfiloPrivato */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              <BackIcon />
            </button>
            <h1 className={styles.navTitle}>Profilo Professionale</h1>
          </div>
          <div className={styles.userDropdown}>
            {media && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>★ {media.toFixed(1)}</span>}
            <span>{nome}</span>
            <div className={styles.miniAvatar}>{nome[0]?.toUpperCase()}</div>
          </div>
        </header>

        <div className={styles.contentLayout}>

          {/* Sidebar — stessa struttura */}
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

            {/* Separatore + CTA contatto */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {profilo.telefono ? (
                <a
                  href={`tel:${profilo.telefono}`}
                  className={styles.saveBtn}
                  style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 0 }}
                >
                  📞 Chiama ora
                </a>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text)', textAlign: 'center' }}>
                  Nessun contatto disponibile
                </p>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className={styles.mainFormArea}>

            {/* TAB: INFORMAZIONI */}
            {tabAttiva === 'info' && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Informazioni</h2>
                <div className={styles.gridForm}>

                  <div className={styles.inputGroup}>
                    <label>NOME / AZIENDA</label>
                    <input type="text" value={nome} disabled />
                  </div>

                  {profilo.settori?.label && (
                    <div className={styles.inputGroup}>
                      <label>SETTORE</label>
                      <input type="text" value={`${profilo.settori.icona ?? ''} ${profilo.settori.label}`} disabled />
                    </div>
                  )}

                  {profilo.comune && (
                    <div className={styles.inputGroup}>
                      <label>CITTÀ</label>
                      <input type="text" value={profilo.comune} disabled />
                    </div>
                  )}

                  {profilo.telefono && (
                    <div className={styles.inputGroup}>
                      <label>TELEFONO</label>
                      <input type="text" value={profilo.telefono} disabled />
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <label>MESI ATTIVO</label>
                    <input type="text" value={`${mesi} mes${mesi === 1 ? 'e' : 'i'}`} disabled />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>RECENSIONI TOTALI</label>
                    <input type="text" value={recensioni.length} disabled />
                  </div>

                  {media && (
                    <div className={styles.inputGroup}>
                      <label>PUNTEGGIO MEDIO</label>
                      <input type="text" value={`★ ${media.toFixed(1)} / 5`} disabled />
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* TAB: RECENSIONI */}
            {tabAttiva === 'recensioni' && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Recensioni ricevute</h2>

                {haGiaRecensito && (
                  <p className={styles.msgOk} style={{ marginBottom: 16 }}>
                    ✅ Hai già lasciato una recensione per questo professionista.
                  </p>
                )}

                {recensioni.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text)' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
                    <p style={{ fontFamily: 'Lora, serif', fontWeight: 700, color: 'var(--text-h)', marginBottom: 6 }}>
                      Nessuna recensione ancora
                    </p>
                    <p style={{ fontSize: 13 }}>Sii il primo a condividere la tua esperienza.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recensioni.map(r => <RecensioneCard key={r.id} r={r} />)}
                  </div>
                )}
              </section>
            )}

            {/* TAB: LASCIA RECENSIONE */}
            {tabAttiva === 'lascia' && puoRecensire && !haGiaRecensito && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Lascia una recensione</h2>
                <FormRecensione
                  venditoreid={id}
                  sessione={sessione}
                  onInviata={onRecensioneInviata}
                />
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}