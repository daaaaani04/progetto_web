import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import styles from './MieiAnnunci.module.css'
import ChatBox from './Chat'

export default function MieiAnnunci({ sessione }) {
  const [annunci, setAnnunci] = useState([])
  const [offerte, setOfferte] = useState({})
  const [annunciAperti, setAnnunciAperti] = useState({})
  const [loading, setLoading] = useState(true)
  const [chatAttiva,setChatAttiva] = useState(null)


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

  function toggleAnnuncio(annuncioId) {
    setAnnunciAperti(prev => ({
      ...prev,
      [annuncioId]: !prev[annuncioId]
    }))
  }

  async function eliminaAnnuncio(id) {
    const conferma = window.confirm('Sei sicuro di voler eliminare questo annuncio?')
    if (!conferma) return

    const { error } = await supabase
      .from('annunci')
      .delete()
      .eq('id', id)

    if (!error) setAnnunci(prev => prev.filter(a => a.id !== id))
  }

  async function accettaOfferta(offertaId, annuncioId) {
    const conferma = window.confirm('Sei sicuro di voler accettare questa offerta? Le altre offerte verranno rifiutate.')
    if (!conferma) return
  
    const { error: e1 } = await supabase
      .from('offerte')
      .update({ stato: 'accettata' })
      .eq('id', offertaId)
  
    console.log('e1:', e1)
    if (e1) return alert('Errore durante l\'accettazione')
  
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
    if (e3) return alert('Errore aggiornamento annuncio: ' + e3.message)
  
    setOfferte(prev => ({
      ...prev,
      [annuncioId]: prev[annuncioId].map(o => ({
        ...o,
        stato: o.id === offertaId ? 'accettata' : 'rifiutata'
      }))
    }))
  
    setAnnunci(prev => prev.map(a =>
      a.id === annuncioId ? { ...a, stato: 'chiuso' } : a
    ))
  }

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

                {/* Header card */}
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
                      onClick={() => eliminaAnnuncio(a.id)}
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
                    {a.comune && <span>📍 {a.comune}</span>}
                    {a.budget && <span>💶 {a.budget}€</span>}
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
                              <span className={styles.offertaComune}>
                                📍 {o.profiles.comune}
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
    </main>
  )
}