import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribes to the logged-in team's row in `teams` via Realtime.
 * Also fetches their airport unlocks, special ops, informer purchase, and bids.
 *
 * Returns { team, unlocks, specialOps, informerPurchased, bids, dossierAnswers, loading, error }
 */
export default function useTeamData(teamId) {
  const [team, setTeam] = useState(null)
  const [unlocks, setUnlocks] = useState([])
  const [specialOps, setSpecialOps] = useState(null)
  const [informerPurchased, setInformerPurchased] = useState(false)
  const [bids, setBids] = useState([])
  const [dossierAnswers, setDossierAnswers] = useState([])
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
          .select('id, airport_id, unlocked_at')
          .eq('team_id', teamId)
        if (isMounted) setUnlocks(unlockData || [])

        // Special ops submission
        const { data: opsData } = await supabase
          .from('special_ops_submissions')
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle()
        if (isMounted) setSpecialOps(opsData)

        // Informer purchase
        const { data: informerData } = await supabase
          .from('team_informer_purchases')
          .select('id')
          .eq('team_id', teamId)
          .maybeSingle()
        if (isMounted) setInformerPurchased(!!informerData)

        // Auction bids
        const { data: bidData } = await supabase
          .from('auction_bids')
          .select('*')
          .eq('team_id', teamId)
        if (isMounted) setBids(bidData || [])

        // Dossier answers
        const { data: dossierData } = await supabase
          .from('dossier_answers')
          .select('*')
          .eq('team_id', teamId)
        if (isMounted) setDossierAnswers(dossierData || [])

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
          if (payload.eventType === 'INSERT') {
            setUnlocks((prev) => [...prev, payload.new])
          } else if (payload.eventType === 'DELETE') {
            setUnlocks((prev) => prev.filter((u) => u.id !== payload.old.id))
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
            setSpecialOps(payload.new || null)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_informer_purchases', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setInformerPurchased(false)
          } else if (payload.eventType === 'INSERT') {
            setInformerPurchased(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids', filter: `team_id=eq.${teamId}` },
        (payload) => {
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
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dossier_answers', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setDossierAnswers((prev) => prev.filter((a) => a.id !== payload.old.id))
          } else {
            setDossierAnswers((prev) => {
              const idx = prev.findIndex((a) => a.id === payload.new.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = payload.new
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

  return { team, unlocks, specialOps, informerPurchased, bids, dossierAnswers, loading, error }
}
