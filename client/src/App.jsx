// App.jsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import supabase from './lib/supabase'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Annunci from './pages/Annunci'
import MieiAnnunci from './pages/MieiAnnunci'
import NuovoAnnuncio from './pages/NuovoAnnuncio'
import PreventiviInviati from './pages/PreventiviInviati'
import ProfiloPrivato from './pages/ProfiloPrivato'
import Impostazioni from './pages/Impostazioni'
import Supporto from './pages/Supporto'
import ProfiloPubblico from './pages/ProfiloPubblico'

export default function App() {
  const [sessione, setSessione] = useState(null)
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessione(data.session)
      if (data.session) caricaProfilo(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessione(session)
      if (session) caricaProfilo(session.user.id)
      else setProfilo(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function caricaProfilo(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfilo(data)
    setLoading(false)
  }

  if (loading) return <p>Caricamento...</p>

  /*
    BrowserRouter: impacchetta tutto per navigazione
    Routes: mostra componente ch corrsponde alla pagina attuale
    Route: associa drectori a componente
    -> aggiungo Navbar e Footer
  */

  return (
    <BrowserRouter>
      <Navbar sessione={sessione} profilo={profilo} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          sessione ? <Navigate to="/" /> : <Login />
        } />
        <Route path="/miei-annunci" element={
          sessione ? <MieiAnnunci sessione={sessione} /> : <Navigate to="/login" />
        } />
        <Route path="/annunci/nuovo" element={
          sessione ? <NuovoAnnuncio sessione={sessione} /> : <Navigate to="/login" />
        } />
        <Route path="/preventivi" element={
          sessione ? <PreventiviInviati sessione={sessione} /> : <Navigate to="/login" />
        } />
        <Route path="/annunci" element={<Annunci sessione={sessione} />} />
        <Route path="/profilo/:id/privato" element={<ProfiloPrivato sessione={sessione} />} />
        <Route path="/profilo/:id" element={<ProfiloPubblico sessione={sessione} />} />
        <Route path="/impostazioni" element={<Impostazioni sessione={sessione} profilo={profilo} />} />
        <Route path="/supporto" element={<Supporto />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}