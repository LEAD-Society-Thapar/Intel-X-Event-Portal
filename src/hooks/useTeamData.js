import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribes to the logged-in team's row in `teams` via Realtime.
 * Also fetches their airport unlocks, special ops, informer purchase, and bids.
 *
 * Returns { team, unlocks, specialOps, informerPurchased, bids, loading, error }
 */
export default function useTeamData(teamId) {
  const [team, setTeam] = useState(null)
  const [unlocks, setUnlocks] = useState([])
  const [specialOps, setSpecialOps] = useState(null)
  const [specialOpsUnlocked, setSpecialOpsUnlocked] = useState(false)
  const [bids, setBids] = useState([])
  const [dossierProgress, setDossierProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!teamId) return

    let isMounted = true

    async function fetchAll() {
      try {
        // Team data
        const { data: teamData, error: teamErr } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single()
        if (teamErr) throw teamErr
        if (isMounted) setTeam(teamData)

        // Airport unlocks
        const { data: unlockData } = await supabase
          .from('team_airport_unlocks')
          .select('airport_id, unlocked_at')
          .eq('team_id', teamId)
        if (isMounted) setUnlocks(unlockData || [])

        // Special ops submission
        const { data: opsData } = await supabase
          .from('special_ops_submissions')
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle()
        if (isMounted) setSpecialOps(opsData)



        // Auction bids
        const { data: bidData } = await supabase
          .from('auction_bids')
          .select('*')
          .eq('team_id', teamId)
        if (isMounted) setBids(bidData || [])

        // Dossier progress
        const { data: progressData } = await supabase
          .from('team_dossier_progress')
          .select('*')
          .eq('team_id', teamId)
        if (isMounted) setDossierProgress(progressData || [])

        // Special ops unlock
        const { data: opsUnlockData } = await supabase
          .from('team_special_ops_unlocks')
          .select('id')
          .eq('team_id', teamId)
          .maybeSingle()
        if (isMounted) setSpecialOpsUnlocked(!!opsUnlockData)

      } catch (err) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAll()

    // ---- Realtime subscriptions ----

    const teamChannel = supabase
      .channel(`team-${teamId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${teamId}` },
        (payload) => {
          if (payload.new) setTeam(payload.new)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_airport_unlocks', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setUnlocks((prev) => prev.filter((u) => u.id !== payload.old.id))
          } else if (payload.eventType === 'INSERT') {
            setUnlocks((prev) => [...prev, payload.new])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_ops_submissions', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSpecialOps(null)
          } else {
            setSpecialOps(payload.new)
          }
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setBids((prev) => prev.filter((b) => b.id !== payload.old.id))
          } else {
            setBids((prev) => {
              const existing = prev.findIndex((b) => b.id === payload.new.id)
              if (existing >= 0) {
                const next = [...prev]
                next[existing] = payload.new
                return next
              }
              return [...prev, payload.new]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_special_ops_unlocks', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSpecialOpsUnlocked(false)
          } else if (payload.eventType === 'INSERT') {
            setSpecialOpsUnlocked(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_dossier_progress', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setDossierProgress((prev) => prev.filter((p) => p.airport_id !== payload.old.airport_id))
          } else {
            setDossierProgress((prev) => {
              const existing = prev.findIndex((p) => p.airport_id === payload.new.airport_id)
              if (existing >= 0) {
                const next = [...prev]
                next[existing] = payload.new
                return next
              }
              return [...prev, payload.new]
            })
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(teamChannel)
    }
  }, [teamId])

  return { team, unlocks, specialOps, specialOpsUnlocked, bids, dossierProgress, loading, error }
}
