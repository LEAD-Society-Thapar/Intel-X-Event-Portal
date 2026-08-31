import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function InformerStall({ teamId, credits, purchased, cost, content }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canAfford = credits >= cost

  async function handlePurchase() {
    setError('')
    setLoading(true)
    try {
      const { error: rpcError } = await supabase.rpc('purchase_informer', {
        p_team_id: teamId,
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setError(err.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  // ---- Purchased: show content ----
  if (purchased) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="font-mono text-xs text-emerald-400 tracking-[0.2em] mb-3">
          ◉ INFORMER INTEL — ACQUIRED
        </div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content || 'No content available.'}
        </div>
      </div>
    )
  }

  // ---- Available: purchase ----
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
      <div>
        <div className="font-mono text-xs text-gray-400 tracking-[0.2em] mb-1">
          UNKNOWN INFORMER STALL
        </div>
        <p className="text-sm text-gray-400">
          An anonymous source is offering intelligence. Contents are unknown until purchased.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
        <span>Cost:</span>
        <span className="text-amber-400 font-bold">{cost} credits</span>
        <span className="text-gray-600">•</span>
        <span>One purchase only</span>
      </div>

      {error && (
        <p className="text-xs text-amber-400 font-mono">⚠ {error}</p>
      )}

      <button
        onClick={handlePurchase}
        disabled={loading || !canAfford}
        className="w-full py-2 rounded-md text-sm font-mono font-semibold transition-colors
                   bg-cyan-600/20 text-cyan-400 border border-cyan-500/30
                   hover:bg-cyan-600/30
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? 'PROCESSING...'
          : !canAfford
            ? `INSUFFICIENT CREDITS (need ${cost})`
            : `ACQUIRE INTEL — ${cost} CREDITS`
        }
      </button>
    </div>
  )
}
