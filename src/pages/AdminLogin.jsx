import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginAsAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginAsAdmin(email, password)
      navigate('/admin', { replace: true })
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
          <div className="font-mono text-xs text-amber-500 tracking-[0.3em] mb-2">
            RESTRICTED // COMMAND ACCESS
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            GAME MASTER CONSOLE
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            INTEL-X — Admin Portal
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                Admin Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@intelx.local"
                autoComplete="email"
                className="mt-1.5 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                           text-white text-sm
                           placeholder:text-gray-600
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                           transition-colors"
              />
            </label>

            <label className="block">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1.5 w-full bg-[#0a0e17] border border-white/10 rounded-md px-3 py-2.5
                           text-white text-sm
                           placeholder:text-gray-600
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
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
              disabled={loading || !email.trim() || !password}
              className="w-full py-2.5 rounded-md font-mono text-sm font-semibold tracking-wide uppercase
                         bg-amber-600 text-white hover:bg-amber-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS CONSOLE'}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-gray-600 mt-6 font-mono">
          Shared organizer credential — all mentors use the same account
        </p>
      </div>
    </div>
  )
}
