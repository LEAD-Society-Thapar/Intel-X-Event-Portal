import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AirportCard from '../components/AirportCard'
import SpecialOpsCard from '../components/SpecialOpsCard'
import InformerStall from '../components/InformerStall'

export default function TeamDashboard() {
  const { team, unlocks, specialOps, informerPurchased, gameState } = useOutletContext()
  const [airports, setAirports] = useState([])
  const [airportsLoading, setAirportsLoading] = useState(true)

  useEffect(() => {
    async function fetchAirports() {
      const { data } = await supabase
        .from('airports')
        .select('id, code, name, domain, cost, fragment_name')
        .order('cost', { ascending: true })
      setAirports(data || [])
      setAirportsLoading(false)
    }
    fetchAirports()
  }, [])

  const { currentPhase } = gameState
  const marketplaceLocked = currentPhase === 't50_auction' || currentPhase === 't55_final'
  const showSpecialOps = [
    't20_special_ops', 't35_expansion', 't45_catalogue', 't50_auction', 't55_final'
  ].includes(currentPhase)
  const showAuction = [
    't45_catalogue', 't50_auction', 't55_final'
  ].includes(currentPhase)

  const unlockedIds = new Set(unlocks.map((u) => u.airport_id))

  if (currentPhase === 'not_started') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="font-mono text-xs text-gray-500 tracking-[0.3em] mb-4">
          STANDBY
        </div>
        <h2 className="text-2xl font-bold text-gray-300 mb-2">
          Awaiting HQ Authorization
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Field Operations have not begun. Stand by for the opening broadcast.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* ---- Section: Airport Marketplace ---- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Airport Marketplace
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {marketplaceLocked
                ? 'MARKETPLACE CLOSED — NO FURTHER PURCHASES'
                : 'Unlock dossiers to access intelligence'}
            </p>
          </div>
          {showAuction && (
            <Link
              to="/auction"
              className="text-xs font-mono px-3 py-1.5 rounded border border-amber-500/30 text-amber-400
                         hover:bg-amber-500/10 transition-colors"
            >
              AUCTION →
            </Link>
          )}
        </div>

        {airportsLoading ? (
          <div className="text-center py-8 text-gray-500 font-mono text-sm animate-pulse">
            Loading stations...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {airports.map((airport) => (
              <AirportCard
                key={airport.id}
                airport={airport}
                isUnlocked={unlockedIds.has(airport.id)}
                isLocked={marketplaceLocked}
                teamId={team.id}
                credits={team.credits_balance}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---- Section: Special Intelligence Operation ---- */}
      {showSpecialOps && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Special Intelligence Operation
          </h2>
          <SpecialOpsCard
            teamId={team.id}
            credits={team.credits_balance}
            specialOps={specialOps}
            currentPhase={currentPhase}
          />
        </section>
      )}

      {/* ---- Section: Unknown Informer Stall ---- */}
      {gameState.informerStallActive && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Unknown Informer
          </h2>
          <InformerStall
            teamId={team.id}
            credits={team.credits_balance}
            purchased={informerPurchased}
            cost={gameState.informerStallCost}
            content={gameState.informerStallContent}
          />
        </section>
      )}
    </div>
  )
}
