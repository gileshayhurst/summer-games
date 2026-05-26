import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAYERS = ['Giles', 'Sherm', 'Rob', 'Ant', 'Noah', 'Cole', 'Rowan', 'Jackson', 'Max', 'Adrian', 'Suren']

async function seed() {
  console.log('Seeding players...')
  for (const name of PLAYERS) {
    const { error } = await supabase.from('users').upsert({ name }, { onConflict: 'name' })
    if (error) console.error(`  ✗ ${name}: ${error.message}`)
    else console.log(`  ✓ ${name}`)
  }
  console.log('Done.')
}

seed()
