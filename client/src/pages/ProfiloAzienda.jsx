import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import styles from './ProfiloAzienda.module.css';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export default function ProfiloAzienda({ sessione }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profilo, setProfilo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabAttiva, setTabAttiva] = useState('details');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Campi form
  const [nomeValue, setNomeValue] = useState('');
  const [comuneValue, setComuneValue] = useState('');
  const [telefonoValue, setTelefonoValue] = useState('');

  useEffect(() => {
    caricaProfilo();
  }, [id]);

  async function caricaProfilo() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, settori(label)')
      .eq('id', id)
      .single();

    setProfilo(data);
    setNomeValue(data?.nome_azienda || data?.nome || '');
    setComuneValue(data?.comune || '');
    setTelefonoValue(data?.telefono || '');
    setLoading(false);
  }

  async function handleSalva(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(isVenditore ? { nome_azienda: nomeValue } : { nome: nomeValue }),
        comune: comuneValue,
        telefono: telefonoValue,
      })
      .eq('id', id);
    setSaveLoading(false);
    setSaveMsg(error
      ? { tipo: 'errore', testo: error.message }
      : { tipo: 'ok', testo: 'Profilo aggiornato con successo.' }
    );
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (nuovaPassword !== confermaPassword) {
      setPwMsg({ tipo: 'errore', testo: 'Le password non coincidono.' });
      return;
    }
    if (nuovaPassword.length < 6) {
      setPwMsg({ tipo: 'errore', testo: 'La password deve essere di almeno 6 caratteri.' });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: nuovaPassword });
    setPwLoading(false);
    if (error) {
      setPwMsg({ tipo: 'errore', testo: error.message });
    } else {
      setPwMsg({ tipo: 'ok', testo: 'Password aggiornata con successo.' });
      setNuovaPassword('');
      setConfermaPassword('');
    }
  }

  if (loading) return <div className={styles.loading}>Caricamento in corso...</div>;
  if (!profilo) return <div className={styles.error}>Profilo non trovato.</div>;

  const isVenditore = profilo.ruolo === 'venditore';
  const isAcquirente = profilo.ruolo === 'acquirente';
  const nomeDisplay = isVenditore
    ? (profilo.nome_azienda || `${profilo.nome} ${profilo.cognome}`)
    : `${profilo.nome} ${profilo.cognome}`;

  const tabs = [
    { id: 'details', label: 'I miei dettagli' },
    { id: 'password', label: 'Cambia password' },
    ...(isVenditore ? [{ id: 'pubblicazione', label: 'Profilo pubblico' }] : []),
    ...(isAcquirente ? [{ id: 'annunci', label: 'I miei annunci' }] : []),
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              <BackIcon />
            </button>
            <h1 className={styles.navTitle}>
              {isVenditore ? 'Profilo Professionale' : 'Il mio account'}
            </h1>
          </div>
          <div className={styles.userDropdown}>
            <span>{nomeDisplay}</span>
            <div className={styles.miniAvatar}>
              {nomeDisplay[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className={styles.contentLayout}>

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
          </aside>

          <main className={styles.mainFormArea}>

            {/* TAB: DETTAGLI */}
            {tabAttiva === 'details' && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>
                  {isVenditore ? 'Dettagli azienda' : 'Dettagli account'}
                </h2>
                <form onSubmit={handleSalva}>
                  <div className={styles.gridForm}>

                    <div className={styles.inputGroup}>
                      <label>{isVenditore ? 'NOME AZIENDA' : 'NOME'}</label>
                      <input
                        type="text"
                        value={nomeValue}
                        onChange={e => setNomeValue(e.target.value)}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label>EMAIL</label>
                      <input
                        type="email"
                        defaultValue={sessione?.user?.email}
                        disabled
                      />
                    </div>

                    {isVenditore && profilo.settori?.label && (
                      <div className={styles.inputGroup}>
                        <label>SETTORE</label>
                        <input
                          type="text"
                          defaultValue={profilo.settori.label}
                          disabled
                        />
                      </div>
                    )}

                    <div className={styles.inputGroup}>
                      <label>CITTÀ</label>
                      <input
                        type="text"
                        value={comuneValue}
                        onChange={e => setComuneValue(e.target.value)}
                        placeholder="es. Roma"
                      />
                    </div>

                    <div className={styles.inputGroupFull}>
                      <label>TELEFONO</label>
                      <div className={styles.phoneInput}>
                        <div className={styles.countryCode}>
                          <span>🇮🇹 +39</span>
                        </div>
                        <input
                          type="text"
                          value={telefonoValue}
                          onChange={e => setTelefonoValue(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {saveMsg && (
                    <p className={saveMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                      {saveMsg.testo}
                    </p>
                  )}

                  <button type="submit" className={styles.saveBtn} disabled={saveLoading}>
                    {saveLoading ? 'Salvataggio…' : 'Salva modifiche'}
                  </button>
                </form>
              </section>
            )}

            {/* TAB: PASSWORD */}
            {tabAttiva === 'password' && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Sicurezza account</h2>
                <form onSubmit={handlePasswordUpdate}>
                  <div className={styles.gridForm}>
                    <div className={styles.inputGroup}>
                      <label>NUOVA PASSWORD</label>
                      <input
                        type="password"
                        placeholder="Minimo 6 caratteri"
                        value={nuovaPassword}
                        onChange={e => setNuovaPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>CONFERMA PASSWORD</label>
                      <input
                        type="password"
                        placeholder="Ripeti la nuova password"
                        value={confermaPassword}
                        onChange={e => setConfermaPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {pwMsg && (
                    <p className={pwMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                      {pwMsg.testo}
                    </p>
                  )}

                  <button type="submit" className={styles.saveBtnGhost} disabled={pwLoading}>
                    {pwLoading ? 'Aggiornamento…' : 'Aggiorna password'}
                  </button>
                </form>
              </section>
            )}

            {/* TAB: PROFILO PUBBLICO — solo venditore */}
            {tabAttiva === 'pubblicazione' && isVenditore && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Profilo pubblico</h2>
                <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
                  Questa è la pagina che vedono i potenziali clienti quando cercano professionisti nel tuo settore.
                </p>
                <a
                  href={`/profilo/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.saveBtn}
                  style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                >
                  Visualizza il tuo profilo pubblico →
                </a>
              </section>
            )}

            {/* TAB: I MIEI ANNUNCI — solo acquirente */}
            {tabAttiva === 'annunci' && isAcquirente && (
              <section className={styles.formCard}>
                <h2 className={styles.sectionTitle}>I miei annunci</h2>
                <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
                  Gestisci qui tutti gli annunci che hai pubblicato sulla piattaforma.
                </p>
                <a
                  href="/miei-annunci"
                  className={styles.saveBtn}
                  style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                >
                  Vai ai miei annunci →
                </a>
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}