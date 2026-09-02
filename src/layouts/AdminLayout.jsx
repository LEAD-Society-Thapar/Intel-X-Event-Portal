import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useGameState from '../hooks/useGameState'

const PHASE_LABELS = {
  not_started: 'NOT STARTED',
  t00_briefing: 'T+00 BRIEFING',
  t20_special_ops: 'T+20 SPECIAL OPS',
  t35_expansion: 'T+35 EXPANSION',
  t45_catalogue: 'T+45 CATALOGUE',
  t50_auction: 'T+50 AUCTION',
  t55_final: 'T+55 FINAL',
}

const NAV_ITEMS = [
  { to: '/admin',         label: 'Overview',      end: true },
  { to: '/admin/scores',  label: 'Round 1 Scores' },
  { to: '/admin/ops',      label: 'Special Ops' },
  { to: '/admin/dossiers', label: 'Dossiers' },
  { to: '/admin/auction',  label: 'Auction' },
  { to: '/admin/teams',   label: 'Teams' },
  { to: '/admin/round3',  label: 'Round 3' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { currentPhase } = useGameState()
  const phaseLabel = PHASE_LABELS[currentPhase] || 'UNKNOWN'

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 flex flex-col">
      {/* ---- Top header ---- */}
      <header className="border-b border-white/10 bg-[#0a0e17]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400 tracking-[0.2em]">
              GAME MASTER CONSOLE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {phaseLabel}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* ---- Sidebar nav ---- */}
        <nav className="w-48 shrink-0 border-r border-white/10 py-4 px-2 hidden md:block">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-mono transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile nav */}
        <nav className="md:hidden border-b border-white/10 w-full overflow-x-auto">
          <div className="flex gap-1 px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ---- Main content ---- */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
