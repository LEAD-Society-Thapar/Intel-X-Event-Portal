import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AuctionCard from '../components/AuctionCard'

export default function Auction() {
  const { team, bids, gameState } = useOutletContext()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const { currentPhase } = gameState

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from('auction_items')
        .select('id, name, public_teaser, hidden_content, category_note')
        .order('name', { ascending: true })
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [])

  const showCatalogue = ['t45_catalogue', 't50_auction', 't55_final'].includes(currentPhase)
  const auctionOpen = currentPhase === 't50_auction'
  const auctionClosed = currentPhase === 't55_final'

  // Build a bid lookup: item_id → bid object
  const bidMap = {}
  for (const bid of bids) {
    bidMap[bid.item_id] = bid
  }

  // Pre-catalogue: nothing to show
  if (!showCatalogue) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-8 block"
        >
          ← Back to Dashboard
        </Link>
        <div className="font-mono text-xs text-gray-500 tracking-[0.3em] mb-4">
          CLASSIFIED
        </div>
        <h2 className="text-2xl font-bold text-gray-300 mb-2">
          Asset Catalogue Not Yet Released
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          The Classified Asset Catalogue will be distributed at T+45. Stand by.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-white">
          Classified Asset Catalogue
        </h2>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          {auctionOpen
            ? 'BLIND AUCTION OPEN — Submit sealed bids (whole numbers only)'
            : auctionClosed
              ? 'AUCTION CLOSED — Results pending adjudication'
              : 'CATALOGUE PREVIEW — Bidding opens at T+50'
          }
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 font-mono text-sm animate-pulse">
          Loading assets...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <AuctionCard
              key={item.id}
              item={item}
              bid={bidMap[item.id] || null}
              auctionOpen={auctionOpen}
              auctionClosed={auctionClosed}
              teamId={team.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
