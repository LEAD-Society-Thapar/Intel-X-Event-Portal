import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SpecialOpsCard({ teamId, credits, specialOps, currentPhase }) {
  const [directive, setDirective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const OPS_COST = 15
  const canAfford = credits >= OPS_COST
  const alreadySubmitted = !!specialOps
  const isResolved = specialOps?.resolved_by_admin

  async function handleSubmit(e) {
    e.preventDefault()
    if (!directive.trim()) return

    setError('')
    setLoading(true)
    try {
      const { error: rpcError } = await supabase.rpc('submit_special_ops', {
        p_team_id: teamId,
        p_directive_text: directive.trim(),
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setError(err.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  // ---- State: Resolved ----
  if (isResolved) {
    const tierColors = {
      exceptional: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      successful:  'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      partial:     'text-amber-400 border-amber-500/30 bg-amber-500/10',
      limited:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
      failure:     'text-red-400 border-red-500/30 bg-red-500/10',
    }
    const colorClasses = tierColors[specialOps.outcome_tier] || tierColors.partial

    return (
      <div className={`rounded-lg border p-5 ${colorClasses}`}>
        <div className="font-mono text-xs tracking-[0.2em] mb-3 opacity-80">
          ◉ HQ REPORT — INCOMING TRANSMISSION
        </div>
        <p className="text-sm leading-relaxed mb-3">
          {specialOps.admin_narrative || `Operation result: ${specialOps.outcome_tier}`}
        </p>
        {specialOps.credits_awarded > 0 && (
          <div className="font-mono text-sm font-semibold mt-2">
            Resource Allocation: +{specialOps.credits_awarded} Investigation Credits
          </div>
        )}
        {specialOps.credits_awarded === 0 && (
          <div className="font-mono text-sm text-gray-500 mt-2">
            No additional resources allocated.
          </div>
        )}
      </div>
    )
  }

  // ---- State: Submitted (awaiting review) ----
  if (alreadySubmitted) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="font-mono text-xs text-amber-400 tracking-[0.2em] mb-3 animate-pulse">
          ◎ DIRECTIVE SUBMITTED — AWAITING HQ REVIEW
        </div>
        <div className="bg-white/5 rounded-md p-3 text-sm text-gray-300 leading-relaxed">
          "{specialOps.directive_text}"
        </div>
        <p className="text-xs text-gray-500 font-mono mt-3">
          Your directive is being evaluated by Headquarters. Results will appear here automatically.
        </p>
      </div>
    )
  }

  // ---- State: Available (submit form) ----
  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <div className="font-mono text-xs text-cyan-400 tracking-[0.2em] mb-1">
            SPECIAL INTELLIGENCE OPERATION
          </div>
          <p className="text-sm text-gray-400">
            Submit a written directive or hypothesis for HQ to investigate. This is a one-time operation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <span>Cost:</span>
          <span className="text-amber-400 font-bold">{OPS_COST} credits</span>
          <span className="text-gray-600">•</span>
          <span>One submission only</span>
        </div>

        <textarea
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="Write your intelligence directive here. Be specific — connect observations across domains for a stronger result..."
          rows={4}
          className="w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                     text-sm text-gray-200 placeholder:text-gray-600
                     focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
                     transition-colors resize-none"
        />

        {error && (
          <p className="text-xs text-amber-400 font-mono">⚠ {error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !directive.trim() || !canAfford}
          className="w-full py-2.5 rounded-md text-sm font-mono font-semibold transition-colors
                     bg-cyan-600/20 text-cyan-400 border border-cyan-500/30
                     hover:bg-cyan-600/30
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? 'TRANSMITTING...'
            : !canAfford
              ? `INSUFFICIENT CREDITS (need ${OPS_COST})`
              : 'SUBMIT DIRECTIVE — 15 CREDITS'
          }
        </button>
      </div>
    </form>
  )
}
