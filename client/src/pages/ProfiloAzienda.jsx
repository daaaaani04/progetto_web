import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import styles from './ProfiloAzienda.module.css';

// Componente Icona SVG Inline (Freccia Indietro)
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
    setLoading(false);
  }

  if (loading) return <div className={styles.loading}>Caricamento in corso...</div>;
  if (!profilo) return <div className={styles.error}>Profilo non trovato.</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        
        {/* Header superiore */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              <BackIcon />
            </button>
            <h1 className={styles.navTitle}>Profilo Professionale</h1>
          </div>
          <div className={styles.userDropdown}>
            <span>{profilo.nome}</span>
            <div className={styles.miniAvatar}>{profilo.nome[0]}</div>
          </div>
        </header>

        <div className={styles.contentLayout}>
          {/* Menu Laterale Interno */}
          <aside className={styles.sidebarMenu}>
            <button 
              className={tabAttiva === 'details' ? styles.activeMenu : ''} 
              onClick={() => setTabAttiva('details')}
            >
              I miei dettagli
            </button>
            <button 
              className={tabAttiva === 'password' ? styles.activeMenu : ''} 
              onClick={() => setTabAttiva('password')}
            >
              Cambia password
            </button>
            <button 
              className={tabAttiva === 'notifications' ? styles.activeMenu : ''} 
              onClick={() => setTabAttiva('notifications')}
            >
              Notifiche
            </button>
          </aside>

          {/* Area Moduli Centrale */}
          <main className={styles.mainFormArea}>
            <section className={styles.formCard}>
              <h2 className={styles.sectionTitle}>Dettagli account</h2>
              
              <div className={styles.gridForm}>
                <div className={styles.inputGroup}>
                  <label>NOME / AZIENDA</label>
                  <input type="text" defaultValue={profilo.nome_azienda || profilo.nome} />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>EMAIL</label>
                  <input type="email" defaultValue={sessione?.user?.email} disabled />
                </div>

                <div className={styles.inputGroup}>
                  <label>CITTÀ</label>
                  <input type="text" defaultValue={profilo.comune} placeholder="es. Roma" />
                </div>

                <div className={styles.inputGroup}>
                  <label>CAP</label>
                  <input type="text" placeholder="Postcode" />
                </div>

                <div className={styles.inputGroupFull}>
                  <label>TELEFONO</label>
                  <div className={styles.phoneInput}>
                    <div className={styles.countryCode}>
                      <span>🇮🇹 +39</span>
                    </div>
                    <input type="text" defaultValue={profilo.telefono} />
                  </div>
                </div>
              </div>

              <button className={styles.saveBtn}>Salva modifiche</button>
            </section>

            {/* Sezione Cambio Password (sempre visibile o via tab) */}
            <section className={styles.formCard}>
              <h2 className={styles.sectionTitle}>Sicurezza account</h2>
              <div className={styles.gridForm}>
                <div className={styles.inputGroup}>
                  <label>NUOVA PASSWORD</label>
                  <input type="password" placeholder="********" />
                </div>
                <div className={styles.inputGroup}>
                  <label>CONFERMA PASSWORD</label>
                  <input type="password" placeholder="********" />
                </div>
              </div>
              <button className={styles.saveBtnGhost}>Aggiorna password</button>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}