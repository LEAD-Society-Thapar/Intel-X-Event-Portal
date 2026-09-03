import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribes to `game_state` via Realtime.
 * Returns { currentPhase, phaseStartedAt, informerStallActive, informerStallCost, loading }
 *
 * Used by team pages (gate phase-dependent UI) and the broadcast screen.
 */
export default function useGameState() {
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetch() {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .limit(1)
        .single()

      if (!error && data && isMounted) {
        setGameState(data)
      }
      if (isMounted) setLoading(false)
    }

    fetch()

    const channel = supabase
      .channel(`game-state-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state' },
        (payload) => {
          if (payload.new) setGameState(payload.new)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    currentPhase: gameState?.current_phase ?? 'not_started',
    phaseStartedAt: gameState?.phase_started_at ?? null,
    loading,
  }
}
