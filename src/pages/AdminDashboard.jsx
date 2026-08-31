import { useState } from 'react'
import PhaseAdvancer from '../components/admin/PhaseAdvancer'
import TeamOverview from '../components/admin/TeamOverview'
import useGameState from '../hooks/useGameState'
import { supabase } from '../lib/supabaseClient'

export default function AdminDashboard() {
  const { informerStallActive, currentPhase } = useGameState()
  const [toggling, setToggling] = useState(false)

  async function toggleInformer() {
    setToggling(true)
    try {
      const { error } = await supabase.rpc('toggle_informer', {
        p_active: !informerStallActive
      })
      if (error) throw error
    } catch (err) {
      alert('Failed to toggle informer: ' + err.message)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-8">
      <PhaseAdvancer />

      <section>
        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
          <div>
            <h2 className="text-sm font-semibold text-white">Unknown Informer Stall</h2>
            <p className="text-xs text-gray-500 mt-1">Controls whether teams can purchase the T+35 intelligence.</p>
          </div>
          <button
            onClick={toggleInformer}
            disabled={toggling}
            className={`px-4 py-2 rounded text-xs font-mono font-semibold transition-colors ${
              informerStallActive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {toggling ? '...' : informerStallActive ? 'STALL OPEN (ON)' : 'STALL CLOSED (OFF)'}
          </button>
        </div>
      </section>

      <TeamOverview />
    </div>
  )
}
