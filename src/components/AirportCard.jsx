import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const DOMAIN_COLORS = {
  OPINT:  { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-500/20' },
  CYBINT: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  FININT: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  HUMINT: { bg: 'bg-rose-500/10',  text: 'text-rose-400',  border: 'border-rose-500/20' },
}

export default function AirportCard({ airport, isUnlocked, isLocked, teamId, credits }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const colors = DOMAIN_COLORS[airport.domain] || DOMAIN_COLORS.OPINT

  async function handleUnlock() {
    setError('')
    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('unlock_airport', {
        p_team_id: teamId,
        p_airport_id: airport.id,
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setError(err.message?.replace(/^.*?RAISE EXCEPTION\s*/, '') || 'Unlock failed')
    } finally {
      setLoading(false)
    }
  }

  const canAfford = credits >= airport.cost

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all duration-300
        ${isUnlocked
          ? 'bg-white/5 border-emerald-500/30'
          : isLocked
            ? 'bg-white/[0.02] border-white/5 opacity-60'
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-white text-sm">
              {airport.code}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border} border uppercase tracking-wider`}
            >
              {airport.domain}
            </span>
          </div>
          <p className="text-sm text-gray-400">{airport.name}</p>
        </div>

        <div className="text-right">
          <span className="font-mono text-lg font-bold text-amber-400">
            {airport.cost}
          </span>
          <span className="text-[10px] text-gray-500 block">CREDITS</span>
        </div>
      </div>

      {/* Status / action */}
      {isUnlocked ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">
              DOSSIER UNLOCKED — {airport.fragment_name}
            </span>
          </div>
          <Link
            to={`/dossier/${airport.id}`}
            className="block w-full text-center py-2 rounded-md text-sm font-mono font-semibold
                       bg-emerald-600/20 text-emerald-400 border border-emerald-500/30
                       hover:bg-emerald-600/30 transition-colors"
          >
            View Dossier →
          </Link>
        </div>
      ) : isLocked ? (
        <div className="flex items-center gap-2 py-2">
          <span className="text-xs font-mono text-gray-500">
            MARKETPLACE CLOSED
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleUnlock}
            disabled={loading || !canAfford}
            className={`w-full py-2 rounded-md text-sm font-mono font-semibold transition-colors
              ${canAfford
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30'
                : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              }
              disabled:opacity-50`}
          >
            {loading ? 'PROCESSING...' : canAfford ? 'UNLOCK DOSSIER' : `NEED ${airport.cost} CREDITS`}
          </button>

          {error && (
            <p className="text-xs text-amber-400 font-mono">⚠ {error}</p>
          )}
        </div>
      )}
    </div>
  )
}
