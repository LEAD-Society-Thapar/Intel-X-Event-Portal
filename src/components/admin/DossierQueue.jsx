import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const OUTCOME_OPTIONS = [
  { value: 'exceptional', label: 'Exceptional Analysis (+40)', credits: 40, color: 'text-emerald-400' },
  { value: 'successful',  label: 'Successful Analysis (+30)',  credits: 30, color: 'text-cyan-400' },
  { value: 'partial',     label: 'Partial Success (+20)',       credits: 20, color: 'text-amber-400' },
  { value: 'limited',     label: 'Limited Insight (+10)',       credits: 10, color: 'text-orange-400' },
  { value: 'failure',     label: 'Inadequate Analysis (+0)',    credits: 0,  color: 'text-red-400' },
]

const NARRATIVE_TEMPLATES = {
  exceptional: 'HQ REPORT: Field Unit {TEAM} delivered an exceptional dossier analysis for {AIRPORT}. The response demonstrates thorough cross-referencing of evidence exhibits and draws highly accurate conclusions. Resource Allocation: +40 Investigation Credits.',
  successful: 'HQ REPORT: Field Unit {TEAM} provided a strong analysis for {AIRPORT}. Key questions were answered correctly with sound reasoning. Resource Allocation: +30 Investigation Credits.',
  partial: 'HQ REPORT: Field Unit {TEAM} showed partial understanding of the {AIRPORT} dossier. Some key observations were noted but deeper connections were missed. Resource Allocation: +20 Investigation Credits.',
  limited: 'HQ REPORT: Field Unit {TEAM} engaged with the {AIRPORT} intelligence material but submitted incomplete or partially incorrect conclusions. Resource Allocation: +10 Investigation Credits.',
  failure: 'HQ REPORT: Field Unit {TEAM} — analysis for {AIRPORT} does not align with verified intelligence. No actionable conclusions recovered.',
}

export default function DossierQueue() {
  const [submissions, setSubmissions] = useState([])
  const [teams, setTeams] = useState({})
  const [airports, setAirports] = useState({})
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const [selectedTier, setSelectedTier] = useState('')
  const [narrative, setNarrative] = useState('')

  async function fetchAll() {
    const { data: subs } = await supabase
      .from('dossier_answers')
      .select('*')
      .order('submitted_at', { ascending: true })
    setSubmissions(subs || [])

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name')
    const teamMap = {}
    for (const t of (teamsData || [])) teamMap[t.id] = t.name
    setTeams(teamMap)

    const { data: airportsData } = await supabase
      .from('airports')
      .select('id, code, name')
    const airportMap = {}
    for (const a of (airportsData || [])) airportMap[a.id] = `${a.code} — ${a.name}`
    setAirports(airportMap)

    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  function startResolve(sub) {
    setResolvingId(sub.id)
    setSelectedTier('')
    setNarrative('')
  }

  function handleTierChange(tier) {
    setSelectedTier(tier)
    const sub = submissions.find((s) => s.id === resolvingId)
    const teamName = teams[sub?.team_id] || 'Team'
    const airportName = airports[sub?.airport_id] || 'Unknown Airport'
    const template = NARRATIVE_TEMPLATES[tier] || ''
    setNarrative(template.replace('{TEAM}', teamName).replace('{AIRPORT}', airportName))
  }

  async function handleResolve() {
    if (!selectedTier || !resolvingId) return

    try {
      const { error } = await supabase.rpc('resolve_dossier_answer', {
        p_submission_id: resolvingId,
        p_outcome_tier: selectedTier,
        p_narrative: narrative,
      })
      if (error) throw error
      setResolvingId(null)
      fetchAll()
    } catch (err) {
      alert('Resolution failed: ' + err.message)
    }
  }

  const pending = submissions.filter((s) => !s.resolved_by_admin)
  const resolved = submissions.filter((s) => s.resolved_by_admin)

  if (loading) {
    return <div className="text-gray-500 font-mono text-sm animate-pulse">Loading dossier answers...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Dossier Analysis Queue</h2>

      {/* Pending */}
      {pending.length === 0 ? (
        <p className="text-sm text-gray-500 font-mono">No pending dossier answers.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-semibold text-amber-400">
                    {teams[sub.team_id] || 'Unknown team'}
                  </span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="font-mono text-sm text-gray-300">
                    {airports[sub.airport_id] || 'Unknown airport'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">
                  {new Date(sub.submitted_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 bg-white/5 rounded p-3 mb-3 leading-relaxed">
                "{sub.answer_text}"
              </p>

              {resolvingId === sub.id ? (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <select
                    value={selectedTier}
                    onChange={(e) => handleTierChange(e.target.value)}
                    className="w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2
                               text-sm text-white
                               focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select outcome tier...</option>
                    {OUTCOME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    rows={4}
                    placeholder="HQ Report narrative..."
                    className="w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2
                               text-sm text-gray-200
                               focus:outline-none focus:border-amber-500 resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleResolve}
                      disabled={!selectedTier}
                      className="px-4 py-2 rounded text-xs font-mono font-semibold
                                 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30
                                 hover:bg-emerald-600/30 disabled:opacity-40 transition-colors"
                    >
                      RESOLVE
                    </button>
                    <button
                      onClick={() => setResolvingId(null)}
                      className="px-4 py-2 rounded text-xs font-mono text-gray-400
                                 hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startResolve(sub)}
                  className="px-3 py-1.5 rounded text-xs font-mono font-semibold
                             bg-amber-600/20 text-amber-400 border border-amber-500/30
                             hover:bg-amber-600/30 transition-colors"
                >
                  RESOLVE
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-mono text-gray-400 mb-3 uppercase tracking-wide">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-2">
            {resolved.map((sub) => (
              <div key={sub.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-gray-400">{teams[sub.team_id]}</span>
                    <span className="text-gray-600 mx-2">→</span>
                    <span className="text-sm font-mono text-gray-500">{airports[sub.airport_id]}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-500">{sub.outcome_tier} (+{sub.credits_awarded})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
