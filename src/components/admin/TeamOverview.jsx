import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TeamOverview() {
  const [teams, setTeams] = useState([])
  const [unlocks, setUnlocks] = useState({})
  const [opsMap, setOpsMap] = useState({})
  const [sortKey, setSortKey] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      // Teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('name')
      setTeams(teamsData || [])

      // Unlocks
      const { data: unlocksData } = await supabase
        .from('team_airport_unlocks')
        .select('team_id, airport_id')
      const unlockMap = {}
      for (const u of (unlocksData || [])) {
        if (!unlockMap[u.team_id]) unlockMap[u.team_id] = []
        unlockMap[u.team_id].push(u.airport_id)
      }
      setUnlocks(unlockMap)

      // Special ops
      const { data: opsData } = await supabase
        .from('special_ops_submissions')
        .select('team_id, resolved_by_admin, outcome_tier')
      const ops = {}
      for (const o of (opsData || [])) {
        ops[o.team_id] = o
      }
      setOpsMap(ops)

      setLoading(false)
    }

    fetchAll()

    // Realtime updates for teams
    const channel = supabase
      .channel(`admin-teams-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => fetchAll()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const sortedTeams = [...teams].sort((a, b) => {
    let aVal, bVal
    switch (sortKey) {
      case 'name': aVal = a.name; bVal = b.name; break
      case 'credits': aVal = a.credits_balance; bVal = b.credits_balance; break
      case 'score': aVal = a.score || 0; bVal = b.score || 0; break
      case 'unlocks': aVal = (unlocks[a.id] || []).length; bVal = (unlocks[b.id] || []).length; break
      default: aVal = a.name; bVal = b.name
    }
    if (aVal < bVal) return sortAsc ? -1 : 1
    if (aVal > bVal) return sortAsc ? 1 : -1
    return 0
  })

  const SortHeader = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-3 py-2 text-left text-xs font-mono text-gray-400 cursor-pointer hover:text-gray-200
                 uppercase tracking-wider select-none"
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  if (loading) {
    return (
      <div className="text-sm text-gray-500 font-mono animate-pulse py-8 text-center">
        Loading teams...
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Team Overview</h2>
        <p className="text-sm text-gray-500">
          No teams registered yet. Add teams through the Supabase dashboard or a future admin UI.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Team Overview</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <SortHeader label="Team" field="name" />
              <SortHeader label="Credits" field="credits" />
              <SortHeader label="Score" field="score" />
              <SortHeader label="Airports" field="unlocks" />
              <th className="px-3 py-2 text-left text-xs font-mono text-gray-400 uppercase tracking-wider">
                Ops Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTeams.map((t) => {
              const teamUnlocks = unlocks[t.id] || []
              const ops = opsMap[t.id]
              return (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 font-medium text-white">{t.name}</td>
                  <td className="px-3 py-2.5 font-mono text-amber-400 tabular-nums">
                    {t.credits_balance}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-emerald-400 tabular-nums">
                    {t.score || 0}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-gray-300 tabular-nums">
                    {teamUnlocks.length}/4
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono">
                    {!ops ? (
                      <span className="text-gray-600">—</span>
                    ) : ops.resolved_by_admin ? (
                      <span className="text-emerald-400">{ops.outcome_tier}</span>
                    ) : (
                      <span className="text-amber-400 animate-pulse">pending</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
