import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './Annunci.module.css'
import FormOfferta from '../components/FormOfferta'

export default function Annunci({ sessione }) {   // prop della componente dato in input alla funzione
  const [searchParams] = useSearchParams()        // legge ?settore=idraulica dalla URL
  const [annunci, setAnnunci] = useState([])      // lista annunci caricati dal DB
  const [settori, setSettori] = useState([])      // lista settori per il select
  const [loading, setLoading] = useState(true)    // mostra "Caricamento..." mentre aspetta
  const [filtri, setFiltri] = useState({
    comune: '',
    settore_id: searchParams.get('settore') || '' // se URL ha ?settore=X, parte già filtrato
  })
  const [annuncioSelezionato, setAnnuncioSelezionato] = useState(null) // annuncio su cui aprire il modal
  const [successoOfferta, setSuccessoOfferta] = useState(false)        // gestione offerta inviata con successo
  const [profilo, setProfilo] = useState(null)


  useEffect(() => {
    async function init() {
      // carica tutti i settori dal db per popolare la scrollbar
      const { data: settoriData } = await supabase.from('settori').select('*')
      setSettori(settoriData || [])

      // se c'è una sessione tira giù il comune relativo all'utente proprietario della sessione per usarlo come filtro
      if (sessione) {
        const { data: profilo } = await supabase
          .from('profiles')
          .select('comune , ruolo')
          .eq('id', sessione.user.id)
          .single()
        
        setProfilo(profilo) 

        //tiro giu anche i settori del venditore (lavoratore) per filtrarlo automaticamente
        const { data: settoriVenditore } = await supabase
          .from('venditore_settori')
          .select('settore_id')
          .eq('venditore_id', sessione.user.id)

        // uso searchParam importato da router-react per tirare fuori il settore dall'url
        const settoreDaUrl = searchParams.get('settore')
        // prendo il primo settore: scelta progettuale -> un venditore puo avere più settore
          // in questo momento in registrazione prendo solo un settore
            // db implementato come (venditore_id e settore_id) come chiave primaria -> possono esserci stesso venditore con due settori diversi
        const primoSettore = settoreDaUrl || settoriVenditore?.[0]?.settore_id || ''

        // oggetto che verrà usato come filtro nella ricerca degli annunci
        const filtriIniziali = {
          comune: profilo?.comune || '',
          settore_id: primoSettore
        }

        // setto i filtri
        setFiltri(filtriIniziali)
        // carico gli annunci passando i filtri come parametro
        await caricaAnnunci(filtriIniziali)
      } else {
        const filtriIniziali = {
          comune: '',
          settore_id: searchParams.get('settore') || ''
        }
        setFiltri(filtriIniziali)
        // a meno che non sono un venditore non ho filtri
        await caricaAnnunci(filtriIniziali)
      }
    }

    init()
  }, [sessione, searchParams])

  // le funzioni dichiarate con function vengono hoistate, sollevate in cima 
  async function caricaAnnunci(f = filtri) {
    setLoading(true)    // può essere utile settare una variabile di caricamento che termina al termine dell'operazione 

    //semplicemente costruisco la query
    let query = supabase
      .from('annunci')
      .select('*, settori(*)')
      .eq('stato', 'attivo')
      .order('created_at', { ascending: false })

     // se è presente un comune passato come filtro aggiungo filtro alla query
    if (f.comune) query = query.ilike('comune', `%${f.comune}%`)   // -> cerca il comune filtrato all'interno dei comuni delle query (prima quello che vuoi dopo quello che vuoi)
    // uguale a quello di prima ma questo fa ricerca esatta
    if (f.settore_id) query = query.eq('settore_id', f.settore_id)

    // eseguo chiamata al db
    const { data } = await query

    setAnnunci(data || [])      // modifico valore di annunci, simile a annunci=data ma dinamico (react se ne accorge)
    setLoading(false)
  }

  function handleFiltro(e) {
    const { name, value } = e.target
    setFiltri(prev => ({ ...prev, [name]: value }))   //sovrascrive il filtro che conteneva prev con: il valore
  }

  function handleCerca(e) {
    // blocca il comportamento del refresh
    e.preventDefault()
    caricaAnnunci()
  }

  function handleReset() {
    const vuoti = { comune: '', settore_id: '' }
    setFiltri(vuoti)
    caricaAnnunci(vuoti)
  }

  // lo uso per gestire lo switch del nome quando seleziono un settore
  const settoreSelezionato = settori.find(s => s.id === filtri.settore_id)  // cerca il settore relativo al filtro selezionato in quel momento

  return (
    <main className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <p className={styles.label}>Annunci disponibili</p>
        <h1 className={styles.titolo}>
          {settoreSelezionato ? settoreSelezionato.label : 'Trova lavori'}    {/* componente dinamico che cambia al variare del settore selezionato */} 
          <span className={styles.accent}>.</span>
        </h1>
        <p className={styles.sub}>
          {settoreSelezionato
            ? `Annunci nel settore ${settoreSelezionato.label}`
            : sessione                                                          /* else c'è una sessione */
              ? 'Annunci filtrati in base alla tua zona e ai tuoi settori.'     /* si sessione */
              : 'Sfoglia tutti gli annunci disponibili.'      /* no sessione -> generico e nessn campo selezionato */
          }
        </p>
      </div>

      {/* Filtri */}
      <form className={styles.filtri} onSubmit={handleCerca}>     {/* quando premo cerca nel form -> carico dati con filtri aggiornati*/} 
        <input
          className={styles.input}
          name="comune"
          placeholder="Comune"
          value={filtri.comune}   /* inserisco il valore comune nel form (aggiornato da react) */
          onChange={handleFiltro}     /* i filtri vengono aggiornati istantaneamente ma la chiamata al db avviene solo onSubmit*/
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
        <div className={styles.loadingContainer}>       {/* se in caricamento */}
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className={styles.loadingText}>Ricerca annunci in corso</p>
        </div>
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
                    {a.urgente && (                 /* se è vera la condizione a sx -> è vera anche quella a dx */
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
                    {sessione && profilo?.ruolo === 'venditore' && (
                      <button
                        className={styles.btnOfferta}
                        onClick={() => setAnnuncioSelezionato(a)}       /* al click su invia offerta attivo setAnnuncioSelezionato che apre il Form */
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