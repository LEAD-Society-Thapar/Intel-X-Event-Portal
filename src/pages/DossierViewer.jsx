import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function DossierViewer() {
  const { airportId } = useParams()
  const { team, unlocks, dossierProgress } = useOutletContext()
  const navigate = useNavigate()
  const [airport, setAirport] = useState(null)
  const [loading, setLoading] = useState(true)

  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isUnlocked = unlocks.some((u) => u.airport_id === airportId)
  const progress = dossierProgress?.find((p) => p.airport_id === airportId) || {}

  const allSolved = progress.q1_solved && progress.q2_solved && progress.q3_solved

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!q1.trim() && !q2.trim() && !q3.trim()) {
      setErrorMsg('Please enter at least one answer.')
      return
    }
    setErrorMsg('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('submit_dossier_answers', {
        p_team_id: team.id,
        p_airport_id: airportId,
        p_a1: q1,
        p_a2: q2,
        p_a3: q3
      })
      if (error) throw error

      if (data.q1_newly_correct || data.q2_newly_correct || data.q3_newly_correct) {
        setSuccessMsg(`Intelligence verified. +${data.credits_awarded} credits awarded.`)
        if (data.q1_newly_correct) setQ1('')
        if (data.q2_newly_correct) setQ2('')
        if (data.q3_newly_correct) setQ3('')
      } else {
        setErrorMsg('Incorrect answers detected. Try again.')
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
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

      {/* Intelligence Questionnaire */}
      <div className="bg-[#0f141f] border border-white/10 rounded-lg p-6">
        <h2 className="font-mono text-sm text-cyan-400 tracking-[0.2em] mb-4 flex items-center gap-2">
          INTELLIGENCE QUESTIONNAIRE
          {allSolved && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              100% VERIFIED
            </span>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300 font-medium">
              1. {airport.q1_text}
            </label>
            {progress.q1_solved ? (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2 text-emerald-400 text-sm font-mono flex justify-between items-center">
                <span>VERIFIED</span>
                <span>+10</span>
              </div>
            ) : (
              <input
                type="text"
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
                placeholder="One word answer..."
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
              />
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300 font-medium">
              2. {airport.q2_text}
            </label>
            {progress.q2_solved ? (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2 text-emerald-400 text-sm font-mono flex justify-between items-center">
                <span>VERIFIED</span>
                <span>+10</span>
              </div>
            ) : (
              <input
                type="text"
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
                placeholder="One word answer..."
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
              />
            )}
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300 font-medium">
              3. {airport.q3_text}
            </label>
            {progress.q3_solved ? (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2 text-emerald-400 text-sm font-mono flex justify-between items-center">
                <span>VERIFIED</span>
                <span>+10</span>
              </div>
            ) : (
              <input
                type="text"
                value={q3}
                onChange={(e) => setQ3(e.target.value)}
                placeholder="One word answer..."
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
              />
            )}
          </div>

          {errorMsg && (
            <div className="text-sm font-mono text-red-400 bg-red-400/10 p-3 rounded border border-red-400/20">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="text-sm font-mono text-emerald-400 bg-emerald-400/10 p-3 rounded border border-emerald-400/20">
              {successMsg}
            </div>
          )}

          {!allSolved && (
            <button
              type="submit"
              disabled={submitting || (!q1.trim() && !q2.trim() && !q3.trim())}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-mono text-sm py-3 rounded-md transition-colors"
            >
              {submitting ? 'VERIFYING...' : 'SUBMIT ANALYSIS'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
