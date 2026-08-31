import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuctionCard({ item, bid, auctionOpen, auctionClosed, teamId }) {
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasBid = !!bid
  const isWinner = bid?.is_winner

  async function handleBid(e) {
    e.preventDefault()
    const amount = parseInt(bidAmount, 10)
    if (!amount || amount <= 0) {
      setError('Bid must be a positive whole number')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: rpcError } = await supabase.rpc('place_bid', {
        p_team_id: teamId,
        p_item_id: item.id,
        p_bid_amount: amount,
      })
      if (rpcError) throw rpcError
    } catch (err) {
      setError(err.message || 'Bid failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-300
        ${isWinner
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : hasBid
            ? 'border-amber-500/20 bg-amber-500/5'
            : 'border-white/10 bg-white/5'
        }`}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-mono text-sm font-bold text-white mb-1">
          {item.name}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {item.public_teaser}
        </p>
        {item.category_note && (
          <span className="inline-block mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded
                           bg-white/5 text-gray-500 border border-white/5">
            {item.category_note}
          </span>
        )}
      </div>

      {/* ---- Won: show hidden content ---- */}
      {isWinner && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">
              ASSET ACQUIRED — {bid.bid_amount} CREDITS
            </span>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {item.hidden_content}
          </div>
        </div>
      )}

      {/* ---- Bid placed (not yet resolved) ---- */}
      {hasBid && !isWinner && (
        <div className="flex items-center gap-2 py-2">
          <span className="text-xs font-mono text-amber-400">
            SEALED BID: {bid.bid_amount} credits
          </span>
          {auctionClosed && (
            <span className="text-xs font-mono text-gray-500">
              — Awaiting adjudication
            </span>
          )}
        </div>
      )}

      {/* ---- Auction open, no bid yet ---- */}
      {!hasBid && auctionOpen && (
        <form onSubmit={handleBid} className="space-y-2 mt-2">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2
                         text-sm text-white font-mono text-center
                         placeholder:text-gray-600
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                         transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !bidAmount}
              className="px-4 py-2 rounded-md text-xs font-mono font-semibold
                         bg-amber-600/20 text-amber-400 border border-amber-500/30
                         hover:bg-amber-600/30
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors whitespace-nowrap"
            >
              {loading ? '...' : 'SEAL BID'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400 font-mono">⚠ {error}</p>
          )}
          <p className="text-[10px] text-gray-600 font-mono">
            Sealed bids are final. Whole numbers only. No credit deduction until adjudication.
          </p>
        </form>
      )}

      {/* ---- Catalogue preview (bidding not open yet) ---- */}
      {!hasBid && !auctionOpen && !auctionClosed && (
        <div className="py-2">
          <span className="text-xs font-mono text-gray-500">
            Bidding opens at T+50
          </span>
        </div>
      )}

      {/* ---- Auction closed, no bid placed ---- */}
      {!hasBid && auctionClosed && (
        <div className="py-2">
          <span className="text-xs font-mono text-gray-500">
            NO BID PLACED
          </span>
        </div>
      )}
    </div>
  )
}
