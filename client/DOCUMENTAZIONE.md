# Documentazione del progetto — connetti.

Piattaforma web che mette in contatto **acquirenti** (chi ha bisogno di un servizio) e **venditori/professionisti** (chi offre il servizio).

---

## Struttura generale

```
src/
  main.jsx              — punto di ingresso, monta App nel DOM
  App.jsx               — gestione sessione, routing principale
  lib/
    supabase.js         — client Supabase (connessione al database)
  pages/                — pagine dell'app (una per ogni URL)
  components/           — componenti riutilizzabili usati dentro le pagine
```

---

## Come funziona l'autenticazione (App.jsx)

`App.jsx` è il cuore dell'app. Fa tre cose:

1. **Controlla se c'è una sessione attiva** (utente già loggato) al caricamento.
2. **Ascolta i cambiamenti di login/logout** in tempo reale con `onAuthStateChange`.
3. **Carica il profilo dell'utente** dal database (tabella `profiles`) ogni volta che la sessione cambia.

I dati `sessione` e `profilo` vengono passati come **props** alle pagine che ne hanno bisogno.

### Protezione delle route

- Se sei **loggato** e vai su `/login` → vieni reindirizzato a `/`
- Se **non sei loggato** e provi ad andare su `/miei-annunci`, `/annunci/nuovo`, ecc. → vieni reindirizzato a `/login`
- Le pagine pubbliche (`/`, `/annunci`, `/profilo/:id`, `/supporto`) sono accessibili da tutti

---

## lib/supabase.js

Crea e configura il client Supabase usando le variabili d'ambiente:
- `VITE_SUPABASE_URL` — indirizzo del progetto Supabase
- `VITE_SUPABASE_ANON_KEY` — chiave pubblica anonima (rispetta le regole RLS del database)

Questo file viene importato da quasi tutti gli altri file per fare query al database.

---

## Pagine

### Home (`/`)

**Cosa mostra:** la landing page pubblica della piattaforma.

**Sezioni:**
- **Hero** — titolo principale con due bottoni: "Pubblica un annuncio" e "Sfoglia annunci"
- **Stats** — numeri statici (1.2k annunci, 340 professionisti, 98% soddisfazione)
- **Come funziona** — 3 passi numerati (pubblica, ricevi offerte, scegli)
- **Settori** — griglia di card cliccabili caricate dal database (tabella `settori`); ogni card porta a `/annunci?settore=ID`
- **CTA** — invito ai professionisti a registrarsi

**Logica:** al caricamento fa una query a Supabase per prendere i settori. Se non ne trova, mostra 4 placeholder statici.

---

### Login (`/login`)

**Cosa fa:** unica pagina per sia il **login** che la **registrazione** (si alterna con un toggle).

**Stato interno:**
- `isRegistrazione` — controlla se mostrare il form corto (login) o quello lungo (registrazione)

**Form di login:** solo email e password.

**Form di registrazione:** email, password, nome, cognome, telefono (opzionale), comune (opzionale), ruolo (acquirente o venditore).
- Se il ruolo scelto è **venditore** → appaiono due campi in più: nome azienda e selezione del settore (caricato dal DB).

**Logica auth:**
- Login → `supabase.auth.signInWithPassword`
- Registrazione → `supabase.auth.signUp` con i dati extra passati in `options.data` (questi vengono usati da un trigger nel DB per creare automaticamente il profilo in `profiles`)

**Redirect:** se sei già loggato, `App.jsx` ti manda a `/` prima ancora di vedere questa pagina.

---

### Annunci (`/annunci`)

**Chi la usa:** tutti (pubblico + loggati). I venditori la usano per trovare lavori su cui fare offerta.

**Cosa fa:** mostra la lista degli annunci attivi con filtri per comune e settore.

**Filtri intelligenti:** se sei loggato come venditore, al caricamento:
- Il filtro "comune" viene pre-compilato con il tuo comune
- Il filtro "settore" viene pre-compilato con il tuo settore di lavoro

Se invece arrivi dalla Home cliccando una card settore (`?settore=ID`), il filtro settore parte già attivo.

**Ricerca:** i filtri si aggiornano in tempo reale ma la query al DB avviene solo quando premi "Cerca" (o al caricamento iniziale). Il bottone "Reset" svuota tutto.

**Invia offerta:** il bottone "Invia offerta" appare **solo se sei un venditore loggato**. Cliccandolo si apre il componente `FormOfferta` (modal).

**Stati UI:**
- Loading: tre pallini animati mentre carica
- Vuoto: messaggio "Nessun annuncio trovato" con bottone reset
- Lista: card per ogni annuncio con settore, titolo, comune, budget, data, badge "Urgente"

---

### Nuovo Annuncio (`/annunci/nuovo`)

**Chi la usa:** solo acquirenti loggati.

**Cosa fa:** form per pubblicare un nuovo annuncio.

**Campi:**
- Titolo (obbligatorio)
- Descrizione (opzionale)
- Settore (obbligatorio, select dal DB)
- Comune e Budget (opzionali, in riga)
- Data di scadenza (opzionale, non può essere nel passato)
- Checkbox "Richiesta urgente"

**Logica submit:** inserisce nella tabella `annunci` con `acquirente_id` = ID dell'utente loggato. Dopo il successo, reindirizza a `/miei-annunci`.

---

### Miei Annunci (`/miei-annunci`)

**Chi la usa:** solo acquirenti loggati.

**Cosa fa:** mostra tutti gli annunci pubblicati dall'utente con la gestione delle offerte ricevute.

**Funzionalità per annuncio:**
- **Vedi offerte** — carica le offerte al click (lazy loading: non le carica tutte subito)
- **Elimina** — elimina l'annuncio dopo conferma
- **Badge** — numero di offerte ricevute

**Gestione offerte:**
- Ogni offerta mostra: nome/azienda del venditore, comune, prezzo proposto, messaggio, telefono
- Il nome del venditore è un link al suo profilo pubblico
- Se l'offerta è "inviata" → bottoni **Accetta** e **Rifiuta**
- Accettare un'offerta: mette l'offerta ad "accettata", le altre a "rifiutate", chiude l'annuncio (stato "chiuso")
- Se l'offerta è "accettata" → bottone **Apri chat** che apre il componente `ChatBox`

---

### Preventivi Inviati (`/preventivi`)

**Chi la usa:** solo venditori loggati.

**Cosa fa:** mostra tutte le offerte inviate dal venditore con il relativo stato.

**Card offerta mostra:**
- Titolo e settore dell'annuncio a cui si riferisce
- Comune, budget cliente, badge urgente
- Il tuo prezzo e messaggio
- Stato (inviata / accettata / rifiutata) con colori diversi

**Azioni disponibili:**
- Stato "inviata" → bottone **Ritira offerta** (elimina l'offerta)
- Stato "accettata" → bottone **Apri chat** (per parlare con il cliente) + **Elimina preventivo** (da usare a lavoro completato)

La chat viene aperta con `ChatBox`, passando come destinatario l'`acquirente_id` dell'annuncio.

---

### Profilo Privato (`/profilo/:id/privato`)

**Chi la usa:** l'utente loggato per vedere e modificare il proprio profilo.

**Struttura:** layout a due colonne con sidebar di navigazione a sinistra e contenuto a destra. Su mobile la sidebar diventa un menu hamburger.

**Tab disponibili:**
- **I miei dettagli** — form per modificare nome (o nome azienda), comune, telefono, indirizzo (solo venditore). L'email è visibile ma non modificabile qui. Salva su Supabase con un aggiornamento della tabella `profiles`.
- **Cambia password** — form con nuova password e conferma. Chiama `supabase.auth.updateUser`.
- **Profilo pubblico** *(solo venditore)* — link per aprire il proprio profilo pubblico in un nuovo tab.
- **I miei annunci** *(solo acquirente)* — link a `/miei-annunci`.

Le tab visibili cambiano in base al ruolo (venditore vs acquirente).

---

### Profilo Pubblico (`/profilo/:id`)

**Chi la usa:** chiunque, per vedere il profilo di un venditore/professionista.

**Struttura:** stesso layout del Profilo Privato (sidebar + contenuto), ma in sola lettura.

**Tab disponibili:**
- **Informazioni** — nome, settore, città, telefono, mesi attivo sulla piattaforma, numero e media recensioni
- **Recensioni** — lista delle recensioni ricevute con animazione di entrata (IntersectionObserver)
- **Posizione** *(solo se il venditore ha inserito l'indirizzo)* — mappa Google Maps embedded + link "Apri in Google Maps"
- **Lascia recensione** *(solo se hai un'offerta accettata con questo venditore E non hai già recensito)* — appare il form `FormRecensione`

**Logica "puoi recensire":** controlla se esiste un'offerta con stato "accettata" tra i tuoi annunci e questo venditore. Se sì, e non hai già lasciato una recensione, appare la tab.

**`RecensioneCard`:** sotto-componente interno con effetto fade-in quando entra nel viewport (usa `IntersectionObserver` tramite il custom hook `useInView`).

---

### Impostazioni (`/impostazioni`)

**Chi la usa:** utenti loggati.

**Struttura:** stessa struttura a tab del Profilo Privato.

**Tab:**
- **Account** — modifica email (con conferma via email), cambia password, link al profilo pubblico (solo venditore)
- **Notifiche** — toggle on/off per tipi di notifiche (UI funzionante, salvataggio non ancora collegato al DB)
- **Privacy** — toggle per visibilità profilo, mostra telefono, raccolta dati analitici (UI funzionante, non salvata sul DB)
- **Zona pericolosa** — Logout (con navigazione a `/`) e Elimina account (con conferma, attualmente fa solo logout)

**Componenti interni:** `Toggle` (bottone switch) e `ToggleRow` (riga con testo + toggle), definiti direttamente nel file.

---

### Supporto (`/supporto`)

**Cosa fa:** pagina con domande frequenti (FAQ) filtrabile e sezione contatto.

**FAQ:** 5 domande hardcoded con risposte.

**Ricerca:** barra di ricerca che filtra in tempo reale le FAQ per testo della domanda (senza query al DB, tutto in memoria).

**Contatto:** bottone che apre il client email con `mailto:supporto@connetti.it`.

---

## Componenti

### Navbar (`components/Navbar.jsx`)

Presente su tutte le pagine (montata in `App.jsx`).

**Desktop:** logo a sinistra, link al centro, email/dropdown utente a destra.

**Mobile:** logo + hamburger. Al click si apre un menu verticale.

**Link mostrati in base al ruolo:**
- Venditore → "Home", "Annunci", "Preventivi inviati"
- Acquirente → "Home", "I miei annunci"
- Non loggato → "Home", "Annunci"

**Dropdown utente (loggato):** Profilo, Impostazioni, Supporto, Logout.

**Logout:** al click apre un modal di conferma. Confermando chiama `supabase.auth.signOut()`.

**Chiusura dropdown:** usa un `ref` e `mousedown` listener su `document` per chiudere il dropdown quando si clicca fuori.

---

### Footer (`components/Footer.jsx`)

Presente su tutte le pagine. Semplice: logo, link social (IG, FB, X), copyright con anno dinamico.

---

### FormOfferta (`components/FormOfferta.jsx`)

**Quando appare:** modal che si apre in `Annunci.jsx` quando un venditore clicca "Invia offerta".

**Campi:** prezzo (opzionale) e messaggio (obbligatorio).

**Logica:** inserisce nella tabella `offerte` con `annuncio_id` e `venditore_id`. Se l'offerta esiste già (errore unicità `23505`), mostra un messaggio apposito invece del generico.

**Chiusura:** cliccando fuori dal modal (sull'overlay) o sul bottone X.

**Callback:** chiama `onSuccess()` (passato da Annunci) dopo l'invio, che chiude il modal e mostra un banner "Offerta inviata con successo!" per 3 secondi.

---

### FormRecensione (`components/FormRecensione.jsx`)

**Quando appare:** dentro `ProfiloPubblico.jsx`, tab "Lascia recensione".

**Campi:** stelle (1-5, con hover interattivo e etichetta testuale) e testo libero (opzionale).

**Logica:** inserisce nella tabella `recensioni`. Dopo l'invio chiama `onInviata(nuovaRecensione)` che aggiunge la recensione in cima alla lista senza ricaricare la pagina.

---

### ChatBox (`pages/Chat.jsx`)

**Quando appare:** come modal/overlay in `MieiAnnunci.jsx` (lato acquirente) e `PreventiviInviati.jsx` (lato venditore), dopo che un'offerta è stata accettata.

**Cosa fa:** chat in tempo reale tra acquirente e venditore su una specifica offerta.

**Tempo reale:** usa `supabase.channel()` con `postgres_changes` per ricevere i nuovi messaggi senza fare polling. Al montaggio si iscrive al canale, allo smontaggio si cancella.

**Identificazione messaggi:** i messaggi dell'utente corrente vengono allineati a destra (stile "mio"), quelli dell'altro a sinistra (stile "altro"), confrontando `mittente_id` con `utenteCorrenteId`.

---

## Tabelle del database usate

| Tabella | Descrizione |
|---|---|
| `profiles` | Profili utente (nome, cognome, ruolo, comune, telefono, ecc.) |
| `settori` | Categorie di servizio (idraulica, elettrica, ecc.) |
| `annunci` | Richieste pubblicate dagli acquirenti |
| `offerte` | Preventivi inviati dai venditori sugli annunci |
| `messaggi` | Messaggi della chat, collegati a una specifica offerta (`preventivo_id`) |
| `recensioni` | Recensioni lasciate dagli acquirenti ai venditori |
| `venditore_settori` | Relazione molti-a-molti tra venditori e settori |

---

## Flusso principale dell'app

```
Acquirente:
  Registrati (ruolo: acquirente)
    → Pubblica annuncio (/annunci/nuovo)
    → Vedi offerte ricevute (/miei-annunci)
    → Accetta un'offerta
    → Chatta con il venditore
    → Lascia una recensione (/profilo/:id)

Venditore:
  Registrati (ruolo: venditore, scegli settore)
    → Sfoglia annunci (/annunci) — filtrati per il tuo settore/comune
    → Invia offerta (FormOfferta)
    → Attendi risposta (/preventivi)
    → Se accettata: chatta con il cliente
```
