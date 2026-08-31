import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard component. Wrap protected routes with this.
 *
 * Usage:
 *   <Route element={<ProtectedRoute requiredRole="team" />}>
 *     <Route path="/dashboard" element={<TeamDashboard />} />
 *   </Route>
 */
export default function ProtectedRoute({ requiredRole }) {
  const { team, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <div className="text-gray-400 font-mono text-sm animate-pulse">
          VERIFYING CLEARANCE...
        </div>
      </div>
    )
  }

  if (requiredRole === 'team' && !team) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
