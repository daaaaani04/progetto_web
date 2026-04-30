import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Annunci.module.css'
import FormOfferta from '../components/FormOfferta'

export default function Annunci({ sessione }) {
  const [searchParams] = useSearchParams()
  const [annunci, setAnnunci] = useState([])
  const [settori, setSettori] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtri, setFiltri] = useState({
    comune: '',
    settore_id: searchParams.get('settore') || ''
  })
  const [annuncioSelezionato, setAnnuncioSelezionato] = useState(null)
  const [successoOfferta, setSuccessoOfferta] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: settoriData } = await supabase.from('settori').select('*')
      setSettori(settoriData || [])

      if (sessione) {
        const { data: profilo } = await supabase
          .from('profiles')
          .select('comune')
          .eq('id', sessione.user.id)
          .single()

        const { data: settoriVenditore } = await supabase
          .from('venditore_settori')
          .select('settore_id')
          .eq('venditore_id', sessione.user.id)

        const settoreDaUrl = searchParams.get('settore')
        const primoSettore = settoreDaUrl || settoriVenditore?.[0]?.settore_id || ''

        const filtriIniziali = {
          comune: profilo?.comune || '',
          settore_id: primoSettore
        }

        setFiltri(filtriIniziali)
        await caricaAnnunci(filtriIniziali)
      } else {
        const filtriIniziali = {
          comune: '',
          settore_id: searchParams.get('settore') || ''
        }
        setFiltri(filtriIniziali)
        await caricaAnnunci(filtriIniziali)
      }
    }

    init()
  }, [sessione, searchParams])

  async function caricaAnnunci(f = filtri) {
    setLoading(true)

    let query = supabase
      .from('annunci')
      .select('*, settori(*)')
      .eq('stato', 'attivo')
      .order('created_at', { ascending: false })

    if (f.comune) query = query.ilike('comune', `%${f.comune}%`)
    if (f.settore_id) query = query.eq('settore_id', f.settore_id)

    const { data } = await query
    setAnnunci(data || [])
    setLoading(false)
  }

  function handleFiltro(e) {
    const { name, value } = e.target
    setFiltri(prev => ({ ...prev, [name]: value }))
  }

  function handleCerca(e) {
    e.preventDefault()
    caricaAnnunci()
  }

  function handleReset() {
    const vuoti = { comune: '', settore_id: '' }
    setFiltri(vuoti)
    caricaAnnunci(vuoti)
  }

  const settoreSelezionato = settori.find(s => s.id === filtri.settore_id)

  return (
    <main className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <p className={styles.label}>Annunci disponibili</p>
        <h1 className={styles.titolo}>
          {settoreSelezionato ? settoreSelezionato.label : 'Trova lavori'}
          <span className={styles.accent}>.</span>
        </h1>
        <p className={styles.sub}>
          {settoreSelezionato
            ? `Annunci nel settore ${settoreSelezionato.label}`
            : sessione
              ? 'Annunci filtrati in base alla tua zona e ai tuoi settori.'
              : 'Sfoglia tutti gli annunci disponibili.'
          }
        </p>
      </div>

      {/* Filtri */}
      <form className={styles.filtri} onSubmit={handleCerca}>
        <input
          className={styles.input}
          name="comune"
          placeholder="Comune"
          value={filtri.comune}
          onChange={handleFiltro}
        />
        <select
          className={styles.select}
          name="settore_id"
          value={filtri.settore_id}
          onChange={handleFiltro}
        >
          <option value="">Tutti i settori</option>
          {settori.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button className={styles.btnPrimary} type="submit">Cerca</button>
        <button className={styles.btnSecondary} type="button" onClick={handleReset}>Reset</button>
      </form>

      {/* Risultati */}
      {loading ? (
        <p className={styles.loading}>Caricamento...</p>
      ) : annunci.length === 0 ? (
        <div className={styles.empty}>
          <p>Nessun annuncio trovato con questi filtri.</p>
          <button className={styles.btnSecondary} onClick={handleReset}>
            Rimuovi filtri
          </button>
        </div>
      ) : (
        <>
          <p className={styles.risultati}>{annunci.length} annunci trovati</p>
          <div className={styles.lista}>
            {annunci.map(a => (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.settore}>{a.settori?.label}</span>
                    <h2 className={styles.cardTitolo}>{a.titolo}</h2>
                  </div>
                  <div className={styles.cardTopRight}>
                    {a.urgente && (
                      <span className={styles.urgente}>Urgente</span>
                    )}
                    {a.scade_il && (
                      <span className={styles.scadenza}>
                        Scade il {new Date(a.scade_il).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>

                {a.descrizione && (
                  <p className={styles.descrizione}>{a.descrizione}</p>
                )}

                <div className={styles.cardBottom}>
                  <div className={styles.meta}>
                    {a.comune && <span>📍 {a.comune}</span>}
                    {a.budget && <span>💶 {a.budget}€</span>}
                  </div>
                  <div className={styles.cardBottomRight}>
                    <span className={styles.data}>
                      {new Date(a.created_at).toLocaleDateString('it-IT')}
                    </span>
                    {sessione && (
                      <button
                        className={styles.btnOfferta}
                        onClick={() => setAnnuncioSelezionato(a)}
                      >
                        Invia offerta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {annuncioSelezionato && (
        <FormOfferta
          annuncio={annuncioSelezionato}
          sessione={sessione}
          onClose={() => setAnnuncioSelezionato(null)}
          onSuccess={() => {
            setAnnuncioSelezionato(null)
            setSuccessoOfferta(true)
            setTimeout(() => setSuccessoOfferta(false), 3000)
          }}
        />
      )}

      {successoOfferta && (
        <div className={styles.successo}>
          Offerta inviata con successo!
          <button onClick={() => setSuccessoOfferta(false)}>✕</button>
        </div>
      )}

    </main>
  )
}