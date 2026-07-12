import { useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

function App() {
  const [count, setCount] = useState(0)

  const testSupabase = async () => {
    const { data, error } = await supabase.from('users').select('id').limit(1)

    if (error) {
      console.error('Supabase connection error:', error.message)
      return
    }

    console.log('Supabase connected:', data)
  }

  return (
    <main className="app-shell">
      <h1>AssetFlow</h1>
      <p>React + Vite + Supabase-ready frontend.</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Count is {count}
      </button>
      <button type="button" onClick={testSupabase} className="supabase-button">
        Test Supabase connection
      </button>
    </main>
  )
}

export default App
