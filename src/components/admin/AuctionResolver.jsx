import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AuctionResolver() {
  const [items, setItems] = useState([])
  const [bids, setBids] = useState({})
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(null)

  async function fetchAll() {
    const { data: itemsData } = await supabase
      .from('auction_items')
      .select('id, name, public_teaser')
      .order('name')
    setItems(itemsData || [])

    const { data: bidsData } = await supabase
      .from('auction_bids')
      .select('*')
      .order('bid_amount', { ascending: false })
    const bidMap = {}
    for (const b of (bidsData || [])) {
      if (!bidMap[b.item_id]) bidMap[b.item_id] = []
      bidMap[b.item_id].push(b)
    }
    setBids(bidMap)

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name')
    const teamMap = {}
    for (const t of (teamsData || [])) teamMap[t.id] = t.name
    setTeams(teamMap)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleAssignWinner(itemId, teamId) {
    setResolving(`${itemId}-${teamId}`)
    try {
      const { error } = await supabase.rpc('resolve_auction', {
        p_item_id: itemId,
        p_winning_team_id: teamId,
      })
      if (error) throw error
      fetchAll()
    } catch (err) {
      alert('Resolution failed: ' + err.message)
    } finally {
      setResolving(null)
    }
  }

  if (loading) {
    return <div className="text-gray-500 font-mono text-sm animate-pulse">Loading auction data...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Auction Resolution</h2>

      {items.map((item) => {
        const itemBids = bids[item.id] || []
        const hasWinner = itemBids.some((b) => b.is_winner)
        const winner = itemBids.find((b) => b.is_winner)

        return (
          <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3">
              <h3 className="font-mono text-sm font-bold text-white">{item.name}</h3>
              <p className="text-xs text-gray-400">{item.public_teaser}</p>
            </div>

            {hasWinner && (
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
                ✓ Won by <strong>{teams[winner.team_id]}</strong> for {winner.bid_amount} credits
              </div>
            )}

            {itemBids.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No bids placed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      <th className="px-2 py-1">Team</th>
                      <th className="px-2 py-1">Bid</th>
                      <th className="px-2 py-1">Time</th>
                      <th className="px-2 py-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {itemBids
                      .sort((a, b) => b.bid_amount - a.bid_amount || new Date(a.submitted_at) - new Date(b.submitted_at))
                      .map((bid, i) => (
                        <tr
                          key={bid.id}
                          className={`${i === 0 && !hasWinner ? 'bg-amber-500/5' : ''} ${bid.is_winner ? 'bg-emerald-500/5' : ''}`}
                        >
                          <td className="px-2 py-2 text-gray-300">
                            {teams[bid.team_id] || '?'}
                            {i === 0 && !hasWinner && (
                              <span className="ml-2 text-[10px] font-mono text-amber-400">HIGHEST</span>
                            )}
                          </td>
                          <td className="px-2 py-2 font-mono text-amber-400 tabular-nums">
                            {bid.bid_amount}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-500 font-mono">
                            {new Date(bid.submitted_at).toLocaleTimeString()}
                          </td>
                          <td className="px-2 py-2">
                            {!hasWinner && (
                              <button
                                onClick={() => handleAssignWinner(item.id, bid.team_id)}
                                disabled={resolving === `${item.id}-${bid.team_id}`}
                                className="px-2 py-1 rounded text-[10px] font-mono font-semibold
                                           bg-emerald-600/20 text-emerald-400 border border-emerald-500/30
                                           hover:bg-emerald-600/30
                                           disabled:opacity-40 transition-colors"
                              >
                                {resolving === `${item.id}-${bid.team_id}` ? '...' : 'ASSIGN WINNER'}
                              </button>
                            )}
                            {bid.is_winner && (
                              <span className="text-xs font-mono text-emerald-400">✓ WINNER</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
