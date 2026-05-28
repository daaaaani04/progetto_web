import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './MieiAnnunci.module.css'
import ChatBox from './Chat'

//componente React che implementa la pagina miei annunci in cui un acquirente 
// vede gli annunci da lui pubblicati con relative offerte ricevute da venditori 

export default function MieiAnnunci({ sessione }) {
  /*
  definisco la componente React MieiAnnunci che prende come prop sessione (che contiene i dati dell'utente loggato)
  tramite la hook useState di react definisco le variabili di stato, cioè: annunci, array che contiene tutti gli annunci
  dell'utente; offerte, coppie chiave valore che assegna a ogni ID le sue offerte; annunci aperti, per memorizzare gli 
  annunci aperti (con le offerte visibili); loading, booleano per mostrare la schermata di caricamento; chatAttiva, che contiene l'id dell'offerta
  a cui la chat è associata; e annuncioda eliminare che memorizza l'id dell'annuncio che si vuole eliminare in modo
  da creare una schermata per esser sicuri di eliminarlo 
  */
  const [annunci, setAnnunci] = useState([])
  const [offerte, setOfferte] = useState({})
  const [annunciAperti, setAnnunciAperti] = useState({})
  const [loading, setLoading] = useState(true)
  const [chatAttiva,setChatAttiva] = useState(null)
  const [annuncioDaEliminare, setAnnuncioDaEliminare] = useState(null) // Memorizza l'ID dell'annuncio

  /*
  use effect che gestisce effetti collaterali, ovvero esegue la funzione carica annunci ogni volta che cambia la 
  sessione. 
  caricaAnnunci è una funzione async perché lavora con i db supabase, in particolare eseguo una query che prende 
  dalla tabella annunci, filtrando per le istanze che hanno come acquirente_id l'utente corrente, tutti le colonne
  di annunci, esegue una join con settori e restuituisce tutte le colonne di settori, esegue una join di offerte e 
  conta quante offerte ci sono per ogni riga. Estrare un array di dizionari (JSON) 
  dopo aver recuperato i dati carica ciò che ha preso nella variabile di stato annunci (o [] se c'è un errore con supabase) 
  e imposta loading a false per mostrare la schermata
  */
  useEffect(() => {
    caricaAnnunci()
  }, [sessione])

  async function caricaAnnunci() {
    const { data } = await supabase
      .from('annunci')
      .select('*, settori(*), offerte(count)')
      .eq('acquirente_id', sessione.user.id)
      .order('created_at', { ascending: false })

    setAnnunci(data || [])
    setLoading(false)
  }

  /*
  se le offerte sono già state caricarate nella variabile di stato offerte, semplicemente chiama la toggle e quindi apre o chiude la visualizzazione 
  se non sono state caricate fa una query a supabase, in cui estrae il campo data e prende dalla table offerte 
  tutte le colonne di offerte, fa una join a profiles per prendere tutti i dati del venditore che ha fatto l'offerta 
  filtrando per tutte le offerte che hanno come annuncio_id l'id dell'annuncio di cui vogliamo vedere le offerte 
  poi cambio la variabile di stato offerte a cui aggiungo una coppia con chiave l'id dell'annuncio e valori data
  e imposto a true il valore dell'id in annunci aperti per mostrare immediatamente

  */

  async function caricaOfferte(annuncioId) {
    if (offerte[annuncioId]) {
      toggleAnnuncio(annuncioId)
      return
    }

    const { data } = await supabase
      .from('offerte')
      .select(`
        *,
        profiles (
          id,
          nome,
          cognome,
          telefono,
          comune,
          nome_azienda
        )
      `)
      .eq('annuncio_id', annuncioId)
      .order('created_at', { ascending: false })

    setOfferte(prev => ({ ...prev, [annuncioId]: data || [] }))
    setAnnunciAperti(prev => ({ ...prev, [annuncioId]: true }))
  }
  
  // serve a mostrare o nascondere la lista delle offerte di un annuncio quando si clicca sul vedi offerte
  // cosa fa: cambia lo stato di annunci apperti, prende come input lo stato precedente, copia tutti i dati in esso
  // e cerca l'id dell'annuncio selezionato e gli assegna il valore opposto a quello che c'èera prima(se scrivessi solo annuncioId senza quadre scriverebbe annuncioId)


  function toggleAnnuncio(annuncioId) {
    setAnnunciAperti(prev => ({
      ...prev,
      [annuncioId]: !prev[annuncioId]
    }))
  }

  //funzione legata al bottone elimina per eliminare un annuncio 
  // con una chiamata supabase elimina la riga in annunci con quell'id
  // se non dà errore (error : null) mette nella variabile di stato annunci tutti quelli che c'erano prima senza quello con l'id indicato 
  // e mette che non c'è nessun annuncio da eliminare

  async function eliminaAnnuncio(id) {
    if (!annuncioDaEliminare) return;

    const { error } = await supabase
      .from('annunci')
      .delete()
      .eq('id', id)

    if (!error) { setAnnunci(prev => prev.filter(a => a.id !== id));
                  setAnnuncioDaEliminare(null);
    }
  }

  /*
  funzione per accettare una eventuale offerta. chiedo conferma, se non gliela do evito
  prendo la riga in offerte relativa all'offerta che voglio accettare e cambio lo stato in accettata 
  mette tutte le altre offerte dello stesso annuncio in rifiutata 
  poi chiude l'annuncio impostando il suo stato a chiuso 
  */

  async function accettaOfferta(offertaId, annuncioId) {
    const conferma = window.confirm('Sei sicuro di voler accettare questa offerta? Le altre offerte verranno rifiutate.')
    if (!conferma) return
  
    const { error: e1 } = await supabase
      .from('offerte')
      .update({ stato: 'accettata' })
      .eq('id', offertaId)
  
    console.log('e1:', e1)
    if (e1) return alert('Errore durante l\'accettazione dell\'offerta ')
  
    const { error: e2 } = await supabase
      .from('offerte')
      .update({ stato: 'rifiutata' })
      .eq('annuncio_id', annuncioId)
      .neq('id', offertaId)
  
    console.log('e2:', e2)
    if (e2) return alert('Errore durante il rifiuto delle altre offerte')
  
    const { error: e3 } = await supabase
      .from('annunci')
      .update({ stato: 'chiuso' })
      .eq('id', annuncioId)
  
    console.log('e3:', e3)
    if (e3) return alert('Errore nella chiusura dell\'annuncio: ' + e3.message)
      
    // qui aggiorna la var d st offerte associando alla chiave annuncio di cui si è accettata l'fferta
    // il metodo map crea un nuovo array partendo da prev[annuncioID] in cui copia tutte le proprietà di ogni
    //offera e sovrascrive solo la proprietà stato 
    setOfferte(prev => ({
      ...prev,
      [annuncioId]: prev[annuncioId].map(o => ({
        ...o,
        stato: o.id === offertaId ? 'accettata' : 'rifiutata'
      }))
    }))
  
    // per impostare a chiuso lo stato dell'annuncio di cui si è accettata l'offerta
    setAnnunci(prev => prev.map(a =>
      a.id === annuncioId ? { ...a, stato: 'chiuso' } : a
    ))
  }

  //per rifiutare una singola offerta
  async function rifiutaOfferta(offertaId, annuncioId) {
    const { error } = await supabase
      .from('offerte')
      .update({ stato: 'rifiutata' })
      .eq('id', offertaId)

    if (error) return alert('Errore durante il rifiuto')

    setOfferte(prev => ({
      ...prev,
      [annuncioId]: prev[annuncioId].map(o =>
        o.id === offertaId ? { ...o, stato: 'rifiutata' } : o
      )
    }))
  }

  if (loading) return <p className={styles.loading}>Caricamento...</p>

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>I miei annunci</h1>
      </div>
      {/*se non ci sono annunci mostro una scritta e un riferimeneto a componete pubblica annunci */}
      {annunci.length === 0 ? (
        <div className={styles.empty}>
          <p>Non hai ancora pubblicato nessun annuncio.</p>
          <Link className={styles.btnPrimary} to="/annunci/nuovo">
            Pubblica il primo
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.lista}>
            {annunci.map(a => (
              <div key={a.id} className={styles.card}>

                {/* per ogni annuncio creo una card */}
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.settore}>{a.settori?.label}</span>
                    <h2 className={styles.titolo}>{a.titolo}</h2>
                  </div>
                  <div className={styles.cardTopRight}>
                    <span className={`${styles.stato} ${styles[a.stato]}`}>
                      {a.stato}
                    </span>
                    <button
                      className={styles.btnElimina}
                      onClick={() => setAnnuncioDaEliminare(a.id)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>

                {a.descrizione && (
                  <p className={styles.descrizione}>{a.descrizione}</p>
                )}

                <div className={styles.cardBottom}>
                  <div className={styles.meta}>
                    {a.comune && <span>Luogo: {a.comune}</span>}
                    {a.budget && <span>Budjet: {a.budget}€</span>}
                    {a.urgente && <span className={styles.urgente}>Urgente</span>}
                  </div>
                  <span className={styles.data}>
                    {new Date(a.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>

                {/* Bottone vedi offerte */}
                <button
                  className={styles.btnOfferte}
                  onClick={() => caricaOfferte(a.id)}
                >
                  {annunciAperti[a.id] ? 'Nascondi offerte' : 'Vedi offerte'}
                  {a.offerte?.[0]?.count > 0 && (
                    <span className={styles.badge}>
                      {a.offerte[0].count}
                    </span>
                  )}
                </button>

                {/* Lista offerte */}
                {annunciAperti[a.id] && (
                  <div className={styles.offerte}>
                    {offerte[a.id]?.length === 0 ? (
                      <p className={styles.nessuna}>
                        Nessuna offerta ricevuta ancora.
                      </p>
                    ) : (
                      offerte[a.id].map(o => (
                        <div key={o.id} className={styles.offerta}>
                          <div className={styles.offertaTop}>
                          <div>
                            <Link
                              to={`/profilo/${o.profiles?.id}`}
                              className={styles.nomeVenditore}
                            >
                              {o.profiles?.nome_azienda || `${o.profiles?.nome} ${o.profiles?.cognome}`}
                            </Link>
                            {o.profiles?.comune && (
                              <span className={styles.offertaComune}><br/>
                                  Luogo: {o.profiles.comune}
                              </span>
                            )}
                          </div>
                          <div className={styles.offertaTopRight}>
                            {o.prezzo && (
                              <span className={styles.prezzo}>{o.prezzo}€</span>
                            )}
                            <span className={`${styles.statoOfferta} ${styles[o.stato]}`}>
                              {o.stato}
                            </span>
                          </div>
                          </div>

                          <p className={styles.messaggio}>{o.messaggio}</p>

                          {o.profiles?.telefono && (
                            <p className={styles.telefono}>
                              📞 {o.profiles.telefono}
                            </p>
                          )}

                          {/* Azioni solo se offerta in attesa */}
                          {o.stato === 'inviata' && (
                            <div className={styles.offertaAzioni}>
                              <button
                                className={styles.btnAccetta}
                                onClick={() => accettaOfferta(o.id, a.id)}
                              >
                                Accetta offerta
                              </button>
                              <button
                                className={styles.btnRifiuta}
                                onClick={() => rifiutaOfferta(o.id, a.id)}
                              >
                                Rifiuta
                              </button>
                            </div>
                          )}

                          {o.stato === 'accettata' && (
                            <div className={styles.offertaAzioni}>
                              <button className={styles.btnChat}
                              onClick={() => setChatAttiva(o.id)}>
                                Apri chat
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <Link className={styles.btnPrimary} to="/annunci/nuovo">
              + Nuovo annuncio
            </Link>
          </div>
        </>
      )}
      {chatAttiva && (
        <ChatBox 
          preventivoId={chatAttiva} 
          utenteCorrenteId={sessione.user.id}
          destinatarioId={   // in questo caso il destinatario è il venditore dell'offerta, cerchiamo l'offerta di riferimento
            Object.values(offerte)
              .flat()               
              .find(o => o.id === chatAttiva)?.venditore_id }
          onClose={() => setChatAttiva(null)} 
        />
      )}
      {/* Modale di conferma eliminazione */}
      {annuncioDaEliminare && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sei sicuro di voler eliminare questo annuncio?</h3>
            <p>Questa azione è irreversibile e tutte le offerte ricevute verranno perse.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.btnAnnulla} 
                onClick={() => setAnnuncioDaEliminare(null)}
              >
                Annulla
              </button>
              <button 
                className={styles.btnEliminaConfirm} 
                onClick={() => eliminaAnnuncio(annuncioDaEliminare)}
              >
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}