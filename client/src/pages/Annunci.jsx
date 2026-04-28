// ✅ dopo — ricevi sessione come prop
export default function Annunci({ sessione }) {
    if (sessione) {
      return (
        <div>
          <h1>Annunci Personalizzati</h1>
        </div>
      )
    }
  
    return (
      <div>
        <h1>Annunci Generici</h1>
      </div>
    )
  }