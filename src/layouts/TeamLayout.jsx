import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useTeamData from '../hooks/useTeamData'
import useGameState from '../hooks/useGameState'

const PHASE_LABELS = {
  not_started: 'AWAITING AUTHORIZATION',
  t00_briefing: 'FIELD OPS ACTIVE',
  t20_special_ops: 'SPECIAL OPS LIVE',
  t35_expansion: 'INTELLIGENCE EXPANSION',
  t45_catalogue: 'ASSET CATALOGUE RELEASED',
  t50_auction: 'AUCTION OPEN',
  t55_final: 'ACTION IMMINENT',
}

export default function TeamLayout() {
  const { team: authTeam, logout } = useAuth()
  const { team, unlocks, specialOps, informerPurchased, bids, dossierAnswers, loading } = useTeamData(authTeam?.id)
  const gameState = useGameState()

  const credits = team?.credits_balance ?? 0
  const phaseLabel = PHASE_LABELS[gameState.currentPhase] || 'UNKNOWN'

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 flex flex-col">
      {/* ---- Nav Bar ---- */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e17]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Team name */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              INTEL-X
            </span>
            <span className="text-sm font-medium text-gray-300 truncate max-w-[140px]">
              {team?.name || authTeam?.name || '—'}
            </span>
          </div>

          {/* Center: Phase indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 tracking-wide">
              {phaseLabel}
            </span>
          </div>

          {/* Right: Credits + logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Credits</span>
              <span
                key={credits}
                className="font-mono text-lg font-bold text-amber-400 tabular-nums animate-[pulse_0.4s_ease-in-out]"
              >
                {credits}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile phase indicator */}
        <div className="sm:hidden border-t border-white/5 px-4 py-1.5 flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 tracking-wide">
            {phaseLabel}
          </span>
        </div>
      </nav>

      {/* ---- Main content ---- */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="font-mono text-sm text-gray-500 animate-pulse">
              LOADING INTELLIGENCE...
            </span>
          </div>
        ) : (
          <Outlet context={{ team, unlocks, specialOps, informerPurchased, bids, dossierAnswers, gameState }} />
        )}
      </main>
    </div>
  )
}
