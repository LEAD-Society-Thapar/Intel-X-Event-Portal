import { useState } from 'react'
import useGameState from '../../hooks/useGameState'
import { supabase } from '../../lib/supabaseClient'

const PHASES = [
  { value: 't00_briefing',    label: 'Start Round 2 (T+00)',                     desc: 'Credits load, marketplace goes live' },
  { value: 't20_special_ops', label: 'Open Special Ops (T+20)',                  desc: 'Special Operations form appears for teams' },
  { value: 't35_expansion',   label: 'Close Special Ops / Open Expansion (T+35)', desc: 'Ops window closes, results delivered' },
  { value: 't45_catalogue',   label: 'Release Asset Catalogue (T+45)',           desc: 'Auction items visible, bidding still locked' },
  { value: 't50_auction',     label: 'Lock Marketplace / Open Auction (T+50)',   desc: 'Marketplace locks, 5-minute auction opens' },
  { value: 't55_final',       label: 'Final Broadcast (T+55)',                   desc: 'Auction closes, final broadcast' },
]

const PHASE_ORDER = ['not_started', ...PHASES.map((p) => p.value)]

export default function PhaseAdvancer() {
  const { currentPhase } = useGameState()
  const [loading, setLoading] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const currentIndex = PHASE_ORDER.indexOf(currentPhase)

  async function handleAdvance(phaseValue) {
    setConfirm(null)
    setLoading(phaseValue)
    try {
      const { error } = await supabase.rpc('advance_phase', {
        p_new_phase: phaseValue,
      })
      if (error) throw error
    } catch (err) {
      alert('Failed to advance phase: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-1">Phase Control</h2>
      <p className="text-xs text-gray-500 font-mono mb-4">
        Current: {currentPhase.toUpperCase()}
      </p>

      <div className="space-y-2">
        {PHASES.map((phase, i) => {
          const phaseIndex = PHASE_ORDER.indexOf(phase.value)
          const isCurrent = currentPhase === phase.value
          const isPast = phaseIndex <= currentIndex
          const isNext = phaseIndex === currentIndex + 1
          const isFuture = phaseIndex > currentIndex + 1

          return (
            <div key={phase.value} className="relative">
              <div
                className={`flex items-center justify-between rounded-lg border p-3 transition-all
                  ${isCurrent
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : isPast
                      ? 'border-white/5 bg-white/[0.02] opacity-50'
                      : isNext
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/[0.02] opacity-30'
                  }`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {isPast && !isCurrent && (
                      <span className="text-emerald-500 text-xs">✓</span>
                    )}
                    <span className={`text-sm font-mono font-semibold
                      ${isCurrent ? 'text-amber-400' : isPast ? 'text-gray-500' : 'text-gray-300'}`}
                    >
                      {phase.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 ml-4">{phase.desc}</p>
                </div>

                {isNext && !isCurrent && (
                  confirm === phase.value ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdvance(phase.value)}
                        disabled={!!loading}
                        className="px-3 py-1.5 rounded text-xs font-mono font-semibold
                                   bg-red-600/20 text-red-400 border border-red-500/30
                                   hover:bg-red-600/30 transition-colors
                                   disabled:opacity-40"
                      >
                        {loading === phase.value ? '...' : 'CONFIRM'}
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="px-3 py-1.5 rounded text-xs font-mono text-gray-400
                                   hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirm(phase.value)}
                      className="px-3 py-1.5 rounded text-xs font-mono font-semibold
                                 bg-amber-600/20 text-amber-400 border border-amber-500/30
                                 hover:bg-amber-600/30 transition-colors"
                    >
                      ACTIVATE
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
