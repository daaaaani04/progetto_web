// routes/annunci.js
import supabase from '../lib/supabase.js'
import express from 'express'


const router = express.Router()


router.get('/annunci', async (req, res) => {
  const { data, error } = await supabase
    .from('annunci')
    .select('*, settori(*), profiles(*)')
    .eq('stato', 'attivo')

  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router