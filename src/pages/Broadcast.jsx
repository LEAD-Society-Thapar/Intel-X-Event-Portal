import { useState, useEffect, useRef } from 'react'
import useGameState from '../hooks/useGameState'

/**
 * Verbatim broadcast copy from the source document.
 * DO NOT paraphrase — the dramatic tone is part of the experience.
 */
const PHASE_DATA = {
  not_started: {
    classification: '',
    title: 'INTEL-X',
    subtitle: 'AWAITING AUTHORIZATION',
    body: '',
    duration: null,
  },
  t00_briefing: {
    classification: 'BROADCAST TO ALL UNITS',
    title: 'HQ BRIEFING',
    subtitle: 'Round 2 — Field Operations',
    body: 'The target is moving. Headquarters has allocated limited operational resources for this phase. Each task force carries forward the unused Investigation Credits remaining from Chapter 1. Headquarters retains a reserve pool of operational resources that may become available as the investigation progresses.',
    duration: 20 * 60, // 20 minutes
  },
  t20_special_ops: {
    classification: 'TACTICAL ALERT',
    title: 'HQ UPDATE 01',
    subtitle: 'Special Intelligence Operations — LIVE',
    body: 'A high-priority lead has emerged. Headquarters has a narrow operational window to exploit it before Ghost\'s network adapts. Headquarters can authorize one Special Intelligence Operation for each task force.',
    duration: 15 * 60, // 15 minutes
  },
  t35_expansion: {
    classification: 'DIRECTIVE OVERRIDE',
    title: 'HQ UPDATE 02',
    subtitle: 'Intelligence Expansion — LIVE',
    body: 'Field teams have returned. Several actionable leads have been recovered. Resource allocations have been updated based on operational success.',
    duration: 10 * 60, // 10 minutes
  },
  t45_catalogue: {
    classification: 'ASSET SEIZURE NOTIFICATION',
    title: 'HQ UPDATE 03',
    subtitle: 'Classified Asset Catalogue',
    body: 'Cyber Command has breached a dark-web data broker holding fragmented logs related to today\'s anomalies. The Classified Asset Catalogue is now available for review.',
    duration: 5 * 60, // 5 minutes
  },
  t50_auction: {
    classification: 'MARKET CLOSURE',
    title: 'HQ UPDATE 04',
    subtitle: 'Unknown Informer Phase — OPEN',
    body: 'Primary intelligence gathering is officially terminated. We must act on what we have.',
    duration: 5 * 60, // 5 minutes
  },
  t55_final: {
    classification: 'ACTION IMMINENT',
    title: 'FINAL HQ BROADCAST',
    subtitle: 'Interdiction Window Closing',
    body: 'The final departure window is rapidly approaching. Flight vectors are locking in. The interdiction window closes in 5 minutes. Surrender all verified Intelligence Fragments (INT-FRAG-01 through INT-FRAG-04) to Headquarters immediately.',
    duration: null,
  },
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Broadcast() {
  const { currentPhase, phaseStartedAt } = useGameState()
  const [timeLeft, setTimeLeft] = useState(null)
  const prevPhaseRef = useRef(currentPhase)
  const [transitioning, setTransitioning] = useState(false)

  const data = PHASE_DATA[currentPhase] || PHASE_DATA.not_started

  // Countdown timer
  useEffect(() => {
    if (!data.duration || !phaseStartedAt) {
      setTimeLeft(null)
      return
    }

    function tick() {
      const elapsed = Math.floor((Date.now() - new Date(phaseStartedAt).getTime()) / 1000)
      const remaining = Math.max(0, data.duration - elapsed)
      setTimeLeft(remaining)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [data.duration, phaseStartedAt])

  // Phase transition animation
  useEffect(() => {
    if (prevPhaseRef.current !== currentPhase) {
      setTransitioning(true)
      const timer = setTimeout(() => setTransitioning(false), 600)
      prevPhaseRef.current = currentPhase
      return () => clearTimeout(timer)
    }
  }, [currentPhase])

  return (
    <div
      className={`min-h-screen bg-[#050810] flex flex-col items-center justify-center p-8
                  transition-opacity duration-500
                  ${transitioning ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Idle / not_started state */}
      {currentPhase === 'not_started' ? (
        <div className="text-center">
          <div className="font-mono text-6xl sm:text-8xl font-bold text-white tracking-wider mb-4">
            INTEL-X
          </div>
          <div className="font-mono text-lg sm:text-xl text-gray-500 tracking-[0.4em]">
            AWAITING AUTHORIZATION
          </div>
          <div className="mt-8 w-24 h-0.5 bg-cyan-500/30 mx-auto animate-pulse" />
          <p className="mt-8 font-mono text-xs text-gray-700 tracking-widest">
            LEAD SOCIETY — TIET PATIALA
          </p>
        </div>
      ) : (
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Classification line */}
          {data.classification && (
            <div className="font-mono text-sm sm:text-base text-red-400 tracking-[0.3em] uppercase animate-pulse">
              ◉ {data.classification}
            </div>
          )}

          {/* Title */}
          <h1 className="font-mono text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-wider">
            {data.title}
          </h1>

          {/* Subtitle */}
          {data.subtitle && (
            <p className="font-mono text-lg sm:text-2xl text-cyan-400 tracking-wide">
              {data.subtitle}
            </p>
          )}

          {/* Divider */}
          <div className="w-32 h-px bg-white/20 mx-auto" />

          {/* Body copy */}
          <p className="font-mono text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {data.body}
          </p>

          {/* Countdown */}
          {timeLeft !== null && (
            <div className="mt-12">
              <div className="font-mono text-xs text-gray-500 tracking-[0.3em] mb-3 uppercase">
                Next phase in
              </div>
              <div
                className={`font-mono text-5xl sm:text-7xl font-bold tabular-nums tracking-wider
                  ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          {/* Final state indicator */}
          {currentPhase === 't55_final' && (
            <div className="mt-8">
              <div className="font-mono text-xl text-red-400 tracking-[0.2em] animate-pulse">
                ◉ OPERATION BLACK ROUTE — FINAL PHASE ◉
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
