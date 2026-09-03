import { useState } from 'react'
import PhaseAdvancer from '../components/admin/PhaseAdvancer'
import TeamOverview from '../components/admin/TeamOverview'
import useGameState from '../hooks/useGameState'
import { supabase } from '../lib/supabaseClient'

export default function AdminDashboard() {
  const [resetStep, setResetStep] = useState(0) // 0=idle, 1=confirm, 2=typing
  const [resetInput, setResetInput] = useState('')
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    if (resetInput !== 'RESET') return
    setResetting(true)
    try {
      const { error } = await supabase.rpc('reset_game')
      if (error) throw error
      alert('✅ Game has been fully reset.')
    } catch (err) {
      alert('Failed to reset: ' + err.message)
    } finally {
      setResetting(false)
      setResetStep(0)
      setResetInput('')
    }
  }

  return (
    <div className="space-y-8">
      <PhaseAdvancer />



      <TeamOverview />

      {/* Game Reset — Danger Zone */}
      <section className="mt-12 pt-6 border-t border-red-500/20">
        <h2 className="text-sm font-semibold text-red-400 mb-2">⚠ Danger Zone</h2>
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Reset Entire Game</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Wipes all credits, unlocks, bids, and ops. Resets phase to NOT_STARTED. Teams are kept but scores are cleared.
              </p>
            </div>

            {resetStep === 0 && (
              <button
                onClick={() => setResetStep(1)}
                className="px-4 py-2 rounded text-xs font-mono font-semibold
                           bg-red-600/20 text-red-400 border border-red-500/30
                           hover:bg-red-600/30 transition-colors"
              >
                RESET GAME
              </button>
            )}

            {resetStep === 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setResetStep(2)}
                  className="px-3 py-2 rounded text-xs font-mono font-semibold
                             bg-red-600/30 text-red-400 border border-red-500/40
                             hover:bg-red-600/40 transition-colors"
                >
                  I'M SURE
                </button>
                <button
                  onClick={() => setResetStep(0)}
                  className="px-3 py-2 rounded text-xs font-mono text-gray-400
                             hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {resetStep === 2 && (
            <div className="mt-4 flex items-center gap-3">
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value.toUpperCase())}
                placeholder='Type "RESET" to confirm'
                autoFocus
                className="flex-1 bg-[#0a0e17] border border-red-500/30 rounded-md px-3 py-2
                           text-white font-mono text-sm text-center tracking-widest
                           placeholder:text-gray-600 placeholder:tracking-normal
                           focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              />
              <button
                onClick={handleReset}
                disabled={resetInput !== 'RESET' || resetting}
                className="px-4 py-2 rounded text-xs font-mono font-semibold
                           bg-red-600 text-white border border-red-500
                           hover:bg-red-500 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {resetting ? '...' : 'CONFIRM RESET'}
              </button>
              <button
                onClick={() => { setResetStep(0); setResetInput('') }}
                className="px-3 py-2 rounded text-xs font-mono text-gray-400
                           hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
