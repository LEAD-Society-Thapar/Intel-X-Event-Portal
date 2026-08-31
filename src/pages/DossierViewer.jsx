import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function DossierViewer() {
  const { airportId } = useParams()
  const { team, unlocks } = useOutletContext()
  const navigate = useNavigate()
  const [airport, setAirport] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if team has unlocked this airport
  const isUnlocked = unlocks.some((u) => u.airport_id === airportId)

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

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="font-mono text-[10px] text-gray-600">
          Discuss findings with your team. Answer questions verbally to your field adjudicator.
        </p>
      </div>
    </div>
  )
}
