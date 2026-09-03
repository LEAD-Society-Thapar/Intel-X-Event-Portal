import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Round1ScoreEntry() {
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [credits, setCredits] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from('teams')
        .select('id, name, credits_balance, score')
        .order('name')
      setTeams(data || [])
    }
    fetchTeams()
  }, [success]) // refetch after a save

  // Pre-fill scores when team changes
  useEffect(() => {
    if (!selectedTeam) return
    const t = teams.find((t) => t.id === selectedTeam)
    if (t) {
      setCredits(String(t.credits_balance ?? ''))
    } else {
      setCredits('')
    }
  }, [selectedTeam, teams])

  const parsedCredits = parseInt(credits, 10) || 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedTeam) {
      setError('Select a team first')
      return
    }

    if (parsedCredits < 0 || parsedCredits > 100) {
      setError('Credits must be between 0 and 100')
      return
    }

    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('set_round1_credits', {
        p_team_id: selectedTeam,
        p_credits: parsedCredits,
      })
      if (rpcError) throw rpcError
      const teamName = teams.find((t) => t.id === selectedTeam)?.name || 'Team'
      setSuccess(`${teamName}: ${parsedCredits} credits set`)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-white mb-1">Round 1 Credits</h2>
      <p className="text-xs text-gray-500 font-mono mb-6">
        Enter the credits remaining after Round 1 (0–100)
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
                {t.name} ({t.credits_balance} cr)
              </option>
            ))}
          </select>
        </label>

        {/* Score inputs */}
        <label className="block">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">
            Credits Remaining (0–100)
          </span>
          <input
            type="number"
            min="0"
            max="100"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="mt-1 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2
                       text-white font-mono text-center
                       focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          />
        </label>

        {/* Computed results */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-md bg-white/5 border border-white/10">
          <div>
            <span className="text-[10px] font-mono text-gray-500">CREDITS</span>
            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {parsedCredits}
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
          {loading ? 'SAVING...' : 'SET CREDITS'}
        </button>
      </form>
    </div>
  )
}
