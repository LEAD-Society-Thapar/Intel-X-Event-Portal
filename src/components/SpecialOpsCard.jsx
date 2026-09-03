import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SpecialOpsCard({ teamId, credits, specialOps, specialOpsUnlocked, currentPhase }) {
  const [directive, setDirective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDossier, setShowDossier] = useState(false)

  const OPS_COST = 15
  const canAfford = credits >= OPS_COST
  const alreadySubmitted = !!specialOps
  const isResolved = specialOps?.resolved_by_admin

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: rpcError } = await supabase.rpc('unlock_special_ops', {
        p_team_id: teamId
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setError(err.message || 'Unlock failed')
    } finally {
      setLoading(false)
    }
  }

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
    <>
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="font-mono text-xs text-cyan-400 tracking-[0.2em] mb-1">
              SPECIAL INTELLIGENCE OPERATION
            </div>
            <p className="text-sm text-gray-400 max-w-xl">
              Submit a written directive or hypothesis for HQ to investigate. This is a one-time operation.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-end w-full sm:w-auto">
            {!specialOpsUnlocked ? (
              <button
                onClick={handleUnlock}
                disabled={loading || !canAfford}
                className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-mono font-semibold transition-colors
                           bg-amber-500/20 text-amber-400 border border-amber-500/30
                           hover:bg-amber-500/30 whitespace-nowrap
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'TRANSMITTING...'
                  : !canAfford
                    ? `LOCKED (NEED ${OPS_COST} CREDITS)`
                    : `UNLOCK DOSSIER — ${OPS_COST} CREDITS`
                }
              </button>
            ) : (
              <button
                onClick={() => setShowDossier(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-mono font-semibold transition-colors
                           bg-cyan-500/20 text-cyan-400 border border-cyan-500/30
                           hover:bg-cyan-500/30 whitespace-nowrap"
              >
                VIEW DOSSIER
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <p className="text-xs text-amber-400 font-mono bg-amber-500/10 p-2 rounded border border-amber-500/20">⚠ {error}</p>
        )}

        {!specialOpsUnlocked ? (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <span>Unlock Cost:</span>
            <span className="text-amber-400 font-bold">{OPS_COST} credits</span>
            <span className="text-gray-600">•</span>
            <span>One submission only</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

            <button
              type="submit"
              disabled={loading || !directive.trim()}
              className="w-full py-2.5 rounded-md text-sm font-mono font-semibold transition-colors
                         bg-cyan-600/20 text-cyan-400 border border-cyan-500/30
                         hover:bg-cyan-600/30
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'TRANSMITTING...' : 'SUBMIT DIRECTIVE'}
            </button>
          </form>
        )}
      </div>

      {/* ---- Dossier Modal ---- */}
      {showDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f141f] border border-cyan-900/50 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
              <div>
                <h3 className="font-mono text-sm tracking-widest text-cyan-400">
                  CONFIDENTIAL INTELLIGENCE
                </h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                className="text-gray-500 hover:text-white transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="prose prose-invert max-w-none text-sm text-gray-300">
                <p>
                  Intercepted chatter indicates that Ghost's network has been relying heavily on offshore accounts to launder funds. According to recent wiretap transcripts, there are whispers about a specific account manager who oversees these transactions. 
                </p>
                <p>
                  Headquarters believes that if we can pinpoint the financial network, we can disrupt the entire operation. Review the following questions to help formulate your directive:
                </p>
                
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-md">
                    <p className="font-mono text-xs text-amber-400 mb-2">QUESTION 01</p>
                    <p className="text-gray-200 font-semibold mb-2">
                      Who is the primary contact handling Ghost's offshore financial transactions?
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 border border-white/10 rounded-md">
                    <p className="font-mono text-xs text-amber-400 mb-2">QUESTION 02</p>
                    <p className="text-gray-200 font-semibold mb-2">
                      Which shell company is primarily used to funnel the funds before they reach the main account?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowDossier(false)}
                  className="px-6 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded font-mono text-sm hover:bg-cyan-600/30 transition-colors"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
