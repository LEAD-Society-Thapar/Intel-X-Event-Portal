import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const TIER_MAP = {
  0: 'LIMITED', 20: 'LIMITED',
  21: 'DELTA', 30: 'DELTA',
  31: 'CHARLIE', 40: 'CHARLIE',
  41: 'BRAVO', 50: 'BRAVO',
  51: 'ALPHA', 60: 'ALPHA',
}

function computeTier(total) {
  if (total >= 51) return 'ALPHA'
  if (total >= 41) return 'BRAVO'
  if (total >= 31) return 'CHARLIE'
  if (total >= 21) return 'DELTA'
  return 'LIMITED'
}

const TIER_COLORS = {
  ALPHA: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  BRAVO: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  CHARLIE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  DELTA: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  LIMITED: 'text-red-400 bg-red-500/10 border-red-500/20',
}

export default function Round1ScoreEntry() {
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [bagScan, setBagScan] = useState('')
  const [routeTrace, setRouteTrace] = useState('')
  const [idCheck, setIdCheck] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from('teams')
        .select('id, name, round1_scores, clearance_tier, credits_balance')
        .order('name')
      setTeams(data || [])
    }
    fetchTeams()
  }, [success]) // refetch after a save

  const bs = parseInt(bagScan, 10) || 0
  const rt = parseInt(routeTrace, 10) || 0
  const ic = parseInt(idCheck, 10) || 0
  const total = bs + rt + ic
  const tier = computeTier(total)
  const tierColor = TIER_COLORS[tier]

  // Pre-fill scores when team changes
  useEffect(() => {
    if (!selectedTeam) return
    const t = teams.find((t) => t.id === selectedTeam)
    if (t?.round1_scores) {
      setBagScan(String(t.round1_scores.bag_scan ?? ''))
      setRouteTrace(String(t.round1_scores.route_trace ?? ''))
      setIdCheck(String(t.round1_scores.id_check ?? ''))
    } else {
      setBagScan('')
      setRouteTrace('')
      setIdCheck('')
    }
  }, [selectedTeam, teams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedTeam) {
      setError('Select a team first')
      return
    }

    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('set_round1_scores', {
        p_team_id: selectedTeam,
        p_bag_scan: bs,
        p_route_trace: rt,
        p_id_check: ic,
      })
      if (rpcError) throw rpcError
      const teamName = teams.find((t) => t.id === selectedTeam)?.name || 'Team'
      setSuccess(`${teamName}: ${tier} (${total} credits)`)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-white mb-1">Round 1 Score Entry</h2>
      <p className="text-xs text-gray-500 font-mono mb-6">
        Enter stall scores → system computes clearance tier and starting credits
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team selector */}
        <label className="block">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
            Team
          </span>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="mt-1.5 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                       text-white text-sm
                       focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="">Select a team...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.clearance_tier ? ` (${t.clearance_tier} — ${t.credits_balance} cr)` : ''}
              </option>
            ))}
          </select>
        </label>

        {/* Score inputs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Bag Scan', value: bagScan, setter: setBagScan },
            { label: 'Route Trace', value: routeTrace, setter: setRouteTrace },
            { label: 'ID Check', value: idCheck, setter: setIdCheck },
          ].map(({ label, value, setter }) => (
            <label key={label} className="block">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">
                {label} (0–20)
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="mt-1 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2
                           text-white font-mono text-center
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
          ))}
        </div>

        {/* Computed results */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-md bg-white/5 border border-white/10">
          <div>
            <span className="text-[10px] font-mono text-gray-500">TOTAL</span>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              {total}/60
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500">TIER</span>
            <div className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${tierColor}`}>
              {tier}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500">CREDITS</span>
            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {total}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 font-mono">⚠ {error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 font-mono">✓ Saved: {success}</p>
        )}

        <button
          type="submit"
          disabled={loading || !selectedTeam}
          className="w-full py-2.5 rounded-md font-mono text-sm font-semibold
                     bg-amber-600/20 text-amber-400 border border-amber-500/30
                     hover:bg-amber-600/30
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {loading ? 'SAVING...' : 'SAVE SCORES'}
        </button>
      </form>
    </div>
  )
}
