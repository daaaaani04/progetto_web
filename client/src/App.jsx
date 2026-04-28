// client/src/App.jsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import supabase from './lib/supabase'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Annunci from './pages/Annunci'
import Footer from './components/Footer'

export default function App() {
  const [sessione, setSessione] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // controlla sessione attiva
    supabase.auth.getSession().then(({ data }) => {
      setSessione(data.session)
      setLoading(false)
    })

    // ascolta cambiamenti login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessione(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <p>Caricamento...</p>

  return (
    <BrowserRouter>
      <Navbar sessione={sessione} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          sessione ? <Navigate to="/" /> : <Login />  // se loggato, redirect a home
        } />
        <Route path="/annunci" element={<Annunci sessione={sessione} />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}