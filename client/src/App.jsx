import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Annunci from './pages/Annunci'
import Login from './pages/Login'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/annunci" element={<Annunci />} />
          <Route path="/login" element={<Login />} />
        </Routes>
    </BrowserRouter>
  )
}