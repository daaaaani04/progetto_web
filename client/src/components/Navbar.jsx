import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link to="/">Home</Link>
      <Link to="/annunci">Annunci</Link>
      <Link to="/login">Login</Link>
    </nav>
  )
}