// crea e cofigura un client supabase 
// funzione createClient di librearia supabase che produce un oggetto client che ha tutti i metodi per parlare con il db
import { createClient } from '@supabase/supabase-js'  

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // anon key è la chiave anonima/pubblica di progetto
  // differenza con la service role key non bypassa le RLS del db
)

export default supabase