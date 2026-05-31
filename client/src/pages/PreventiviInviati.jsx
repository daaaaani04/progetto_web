import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'
import styles from './PreventiviInviati.module.css'
import ChatBox from './Chat'
import FormOfferta from '../components/FormOfferta'

export default function PreventiviInviati({ sessione }) {
  const [offerte, setOfferte] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatAttiva, setChatAttiva] = useState(null)
  const [offertaDaReinviare, setOffertaDaReinviare] = useState(null)
  const [confermaEliminaOfferta, setConfermaEliminaOfferta] = useState(null)
  const [confermaEliminaAccettata, setConfermaEliminaAccettata] = useState(null)

  useEffect(() => {
    caricaOfferte()
  }, [sessione])

  async function caricaOfferte() {
    const { data } = await supabase
      .from('offerte')
      .select(`
        *,
        annunci (
          id,
          acquirente_id,
          titolo,
          comune,
          budget,
          urgente,
          settori ( label )
        )
      `)
      .eq('venditore_id', sessione.user.id)
      .order('created_at', { ascending: false })

    setOfferte(data || [])
    setLoading(false)
  }

  async function eliminaOfferta() {
    const { error } = await supabase
      .from('offerte')
      .delete()
      .eq('id', confermaEliminaOfferta)

    if (!error) setOfferte(prev => prev.filter(o => o.id !== confermaEliminaOfferta))
    setConfermaEliminaOfferta(null)
  }

  async function eliminaPreventivoAccettato() {
    const { error } = await supabase
      .from('offerte')
      .delete()
      .eq('id', confermaEliminaAccettata)

    if (!error) setOfferte(prev => prev.filter(o => o.id !== confermaEliminaAccettata))
    setConfermaEliminaAccettata(null)
  }

  const statoColore = {
    inviata: styles.statoInviata,
    accettata: styles.statoAccettata,
    rifiutata: styles.statoRifiutata
  }

  if (loading) return <p className={styles.loading}>Caricamento...</p>

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.label}>I tuoi preventivi</p>
        <h1 className={styles.titolo}>
          Preventivi inviati<span className={styles.accent}>.</span>
        </h1>
        <p className={styles.sub}>
          Tieni traccia delle offerte che hai inviato e del loro stato.
        </p>
      </div>

      {offerte.length === 0 ? (
        <div className={styles.empty}>
          <p>Non hai ancora inviato nessun preventivo.</p>
          <p className={styles.emptySub}>
            Sfoglia gli annunci disponibili e invia la tua prima offerta.
          </p>
        </div>
      ) : (
        <div className={styles.lista}>
          {offerte.map(o => (
            <div key={o.id} className={styles.card}>

              <div className={styles.cardTop}>
                <div>
                  <span className={styles.settore}>
                    {o.annunci?.settori?.label}
                  </span>
                  <h2 className={styles.cardTitolo}>{o.annunci?.titolo}</h2>
                </div>
                <span className={`${styles.stato} ${statoColore[o.stato]}`}>
                  {o.stato}
                </span>
              </div>

              <div className={styles.annuncioMeta}>
                {o.annunci?.comune && <span>Luogo: {o.annunci.comune}</span>}
                {o.annunci?.budget && <span>Budget cliente: {o.annunci.budget}€</span>}
                {o.annunci?.urgente && <span className={styles.urgente}>Urgente</span>}
              </div>

              <div className={styles.divider} />

              <div className={styles.offertaDetails}>
                <div className={styles.offertaRow}>
                  <span className={styles.offertaLabel}>La tua offerta</span>
                  {o.prezzo && (
                    <span className={styles.prezzo}>{o.prezzo}€</span>
                  )}
                </div>
                <p className={styles.messaggio}>{o.messaggio}</p>
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.data}>
                  Inviata il {new Date(o.created_at).toLocaleDateString('it-IT')}
                </span>

                {o.stato === 'inviata' && (
                  <button
                    className={styles.btnElimina}
                    onClick={() => setConfermaEliminaOfferta(o.id)}
                  >
                    Ritira offerta
                  </button>
                )}

                {o.stato === 'accettata' && (
                  <div className={styles.azioniAccettata}>
                    <button className={styles.btnChat} onClick={() => setChatAttiva(o)}>
                      Chat
                    </button>
                    <button
                      className={styles.btnElimina}
                      onClick={() => setConfermaEliminaAccettata(o.id)}
                    >
                      Elimina
                    </button>
                  </div>
                )}

                {o.stato === 'rifiutata' && (
                  <button
                    className={styles.btnReinvia}
                    onClick={() => setOffertaDaReinviare(o)}
                  >
                    Invia nuova offerta
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal ritira offerta */}
      {confermaEliminaOfferta && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Sei sicuro di voler ritirare questa offerta?</h2>
            <p>Non potrai più recuperare questa offerta.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnAnnulla} onClick={() => setConfermaEliminaOfferta(null)}>
                Annulla
              </button>
              <button className={styles.btnLogoutConfirm} onClick={eliminaOfferta}>
                Ritira
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal elimina preventivo accettato */}
      {confermaEliminaAccettata && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confermi di voler eliminare questo preventivo?</h3>
            <p>Procedi solo se il lavoro è stato completato.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnAnnulla} onClick={() => setConfermaEliminaAccettata(null)}>
                Annulla
              </button>
              <button className={styles.btnLogoutConfirm} onClick={eliminaPreventivoAccettato}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {chatAttiva && (
        <ChatBox
          preventivoId={chatAttiva.id}
          utenteCorrenteId={sessione.user.id}
          destinatarioId={chatAttiva.annunci?.acquirente_id}
          onClose={() => setChatAttiva(null)}
        />
      )}

      {offertaDaReinviare && (
        <FormOfferta
          annuncio={offertaDaReinviare.annunci}
          sessione={sessione}
          offertaEsistente={offertaDaReinviare}
          onClose={() => setOffertaDaReinviare(null)}
          onSuccess={() => {
            caricaOfferte()
            setOffertaDaReinviare(null)
          }}
        />
      )}

    </main>
  )
}