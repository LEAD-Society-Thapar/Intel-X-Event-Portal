import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const OUTCOME_OPTIONS = [
  { value: 'exceptional', label: 'Exceptional Operation (+40)', credits: 40, color: 'text-emerald-400' },
  { value: 'successful',  label: 'Successful Operation (+30)',  credits: 30, color: 'text-cyan-400' },
  { value: 'partial',     label: 'Partial Success (+20)',       credits: 20, color: 'text-amber-400' },
  { value: 'limited',     label: 'Limited Recovery (+10)',      credits: 10, color: 'text-orange-400' },
  { value: 'failure',     label: 'Mission Failure (+0)',        credits: 0,  color: 'text-red-400' },
]

const NARRATIVE_TEMPLATES = {
  exceptional: 'HQ REPORT: Field Unit {TEAM} executed a flawless multi-domain intelligence synthesis. The directive demonstrated exceptional operational awareness, connecting critical identifiers across OPINT, CYBINT, FININT, and HUMINT channels. Resource Allocation: +40 Investigation Credits.',
  successful: 'HQ REPORT: Field Unit {TEAM} successfully identified key operational elements and produced logically sound deductions. The directive shows strong investigative capability. Resource Allocation: +30 Investigation Credits.',
  partial: 'HQ REPORT: Field Unit {TEAM} demonstrated basic understanding of the operational landscape but missed deeper cross-domain connections. Resource Allocation: +20 Investigation Credits.',
  limited: 'HQ REPORT: Field Unit {TEAM} showed engagement with the intelligence material but submitted factually incorrect conclusions. Resource Allocation: +10 Investigation Credits.',
  failure: 'HQ REPORT: Field Unit {TEAM} — directive does not align with any verified intelligence. No actionable intelligence recovered.',
}

export default function SpecialOpsQueue() {
  const [submissions, setSubmissions] = useState([])
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const [selectedTier, setSelectedTier] = useState('')
  const [narrative, setNarrative] = useState('')

  async function fetchAll() {
    const { data: subs } = await supabase
      .from('special_ops_submissions')
      .select('*')
      .order('submitted_at', { ascending: true })
    setSubmissions(subs || [])

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name')
    const map = {}
    for (const t of (teamsData || [])) map[t.id] = t.name
    setTeams(map)
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
    const teamName = teams[submissions.find((s) => s.id === resolvingId)?.team_id] || 'Team'
    const template = NARRATIVE_TEMPLATES[tier] || ''
    setNarrative(template.replace('{TEAM}', teamName))
  }

  async function handleResolve() {
    if (!selectedTier || !resolvingId) return

    try {
      const { error } = await supabase.rpc('resolve_special_ops', {
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
    return <div className="text-gray-500 font-mono text-sm animate-pulse">Loading submissions...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Special Ops Resolution Queue</h2>

      {/* Pending */}
      {pending.length === 0 ? (
        <p className="text-sm text-gray-500 font-mono">No pending submissions.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-amber-400">
                  {teams[sub.team_id] || 'Unknown team'}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {new Date(sub.submitted_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 bg-white/5 rounded p-3 mb-3 leading-relaxed">
                "{sub.directive_text}"
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
                  <span className="text-sm font-mono text-gray-400">{teams[sub.team_id]}</span>
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
