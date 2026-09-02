import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function DossierViewer() {
  const { airportId } = useParams()
  const { team, unlocks, dossierAnswers } = useOutletContext()
  const navigate = useNavigate()
  const [airport, setAirport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Check if team has unlocked this airport
  const isUnlocked = unlocks.some((u) => u.airport_id === airportId)

  // Find existing answer for this airport
  const existingAnswer = dossierAnswers?.find((a) => a.airport_id === airportId) || null
  const isSubmitted = !!existingAnswer
  const isResolved = existingAnswer?.resolved_by_admin

  useEffect(() => {
    if (!isUnlocked) return

    async function fetchAirport() {
      const { data } = await supabase
        .from('airports')
        .select('*')
        .eq('id', airportId)
        .single()
      setAirport(data)
      setLoading(false)
    }

    fetchAirport()
  }, [airportId, isUnlocked])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim()) return

    setSubmitError('')
    setSubmitting(true)
    try {
      const { error: rpcError } = await supabase.rpc('submit_dossier_answer', {
        p_team_id: team.id,
        p_airport_id: airportId,
        p_answer_text: answer.trim(),
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setSubmitError(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Redirect if not unlocked
  if (!isUnlocked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-red-400 font-mono text-sm mb-4">
          ⚠ ACCESS DENIED — DOSSIER NOT UNLOCKED
        </div>
        <Link
          to="/dashboard"
          className="text-cyan-400 font-mono text-sm hover:underline"
        >
          ← Return to Dashboard
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <span className="font-mono text-sm text-gray-500 animate-pulse">
          DECRYPTING DOSSIER...
        </span>
      </div>
    )
  }

  if (!airport) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <span className="font-mono text-sm text-red-400">
          Dossier not found
        </span>
      </div>
    )
  }

  // Tier colors for resolved state
  const tierColors = {
    exceptional: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    successful:  'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    partial:     'text-amber-400 border-amber-500/30 bg-amber-500/10',
    limited:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
    failure:     'text-red-400 border-red-500/30 bg-red-500/10',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      {/* Classification header */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-amber-400 tracking-[0.2em]">
            CLASSIFIED DOSSIER
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">
          {airport.code} — {airport.name}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Domain: {airport.domain} | Cost: {airport.cost} credits
        </p>
      </div>

      {/* Intelligence Fragment badge */}
      <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-mono text-sm text-emerald-400">
          AWARDED: {airport.fragment_name}
        </span>
      </div>

      {/* Briefing text */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-mono prose-headings:tracking-wide
                        prose-strong:text-amber-300 prose-code:text-cyan-400
                        whitespace-pre-wrap leading-relaxed text-gray-300">
          {airport.briefing_text}
        </div>
      </div>

      {/* Evidence content */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="font-mono text-xs text-amber-400 tracking-[0.2em] mb-4">
          EVIDENCE PACKAGE
        </h2>
        <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-mono prose-headings:tracking-wide
                        prose-strong:text-amber-300 prose-code:text-cyan-400
                        whitespace-pre-wrap leading-relaxed text-gray-300">
          {airport.evidence_content}
        </div>
      </div>

      {/* ---- Dossier Answer Section ---- */}

      {/* State: Resolved */}
      {isResolved && (
        <div className={`rounded-lg border p-5 ${tierColors[existingAnswer.outcome_tier] || tierColors.partial}`}>
          <div className="font-mono text-xs tracking-[0.2em] mb-3 opacity-80">
            ◉ HQ ANALYSIS REPORT — INCOMING TRANSMISSION
          </div>
          <p className="text-sm leading-relaxed mb-3">
            {existingAnswer.admin_narrative || `Analysis result: ${existingAnswer.outcome_tier}`}
          </p>
          {existingAnswer.credits_awarded > 0 && (
            <div className="font-mono text-sm font-semibold mt-2">
              Resource Allocation: +{existingAnswer.credits_awarded} Investigation Credits
            </div>
          )}
          {existingAnswer.credits_awarded === 0 && (
            <div className="font-mono text-sm text-gray-500 mt-2">
              No additional resources allocated.
            </div>
          )}
        </div>
      )}

      {/* State: Submitted, awaiting review */}
      {isSubmitted && !isResolved && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="font-mono text-xs text-amber-400 tracking-[0.2em] mb-3 animate-pulse">
            ◎ ANALYSIS SUBMITTED — AWAITING HQ REVIEW
          </div>
          <div className="bg-white/5 rounded-md p-3 text-sm text-gray-300 leading-relaxed">
            "{existingAnswer.answer_text}"
          </div>
          <p className="text-xs text-gray-500 font-mono mt-3">
            Your analysis is being evaluated by Headquarters. Results will appear here automatically.
          </p>
        </div>
      )}

      {/* State: Not yet submitted — answer form */}
      {!isSubmitted && (
        <form onSubmit={handleSubmit}>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
            <div>
              <div className="font-mono text-xs text-cyan-400 tracking-[0.2em] mb-1">
                DOSSIER ANALYSIS
              </div>
              <p className="text-sm text-gray-400">
                Submit your analysis of this intelligence briefing. Answer the key questions posed in the dossier. One submission per dossier.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
              <span>Cost:</span>
              <span className="text-emerald-400 font-bold">FREE</span>
              <span className="text-gray-600">•</span>
              <span>Already paid via airport unlock</span>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your analysis here. Answer the key questions, connect observations across evidence exhibits, and provide your conclusions..."
              rows={5}
              className="w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                         text-sm text-gray-200 placeholder:text-gray-600
                         focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
                         transition-colors resize-none"
            />

            {submitError && (
              <p className="text-xs text-amber-400 font-mono">⚠ {submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="w-full py-2.5 rounded-md text-sm font-mono font-semibold transition-colors
                         bg-cyan-600/20 text-cyan-400 border border-cyan-500/30
                         hover:bg-cyan-600/30
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'TRANSMITTING...' : 'SUBMIT ANALYSIS'}
            </button>
          </div>
        </form>
      )}

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="font-mono text-[10px] text-gray-600">
          Discuss findings with your team before submitting your analysis.
        </p>
      </div>
    </div>
  )
}
