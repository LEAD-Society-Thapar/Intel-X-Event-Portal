import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TeamLogin() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginAsTeam } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginAsTeam(code)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-cyan-500 tracking-[0.3em] mb-2">
            CLASSIFIED // TASK FORCE ACCESS
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            INTEL-X
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Operation Black Route — Field Portal
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                Team Access Code
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your login code"
                autoFocus
                autoComplete="off"
                className="mt-1.5 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                           text-white font-mono text-center text-lg tracking-widest
                           placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-sm
                           focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
                           transition-colors"
              />
            </label>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 font-mono">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-2.5 rounded-md font-mono text-sm font-semibold tracking-wide uppercase
                         bg-cyan-600 text-white hover:bg-cyan-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? 'VERIFYING...' : 'AUTHENTICATE'}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-gray-600 mt-6 font-mono">
          LEAD Society — TIET Patiala
        </p>
      </div>
    </div>
  )
}
