import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth & Layouts
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import TeamLayout from './layouts/TeamLayout'
import AdminLayout from './layouts/AdminLayout'

// Public / Auth Pages
import TeamLogin from './pages/TeamLogin'
import AdminLogin from './pages/AdminLogin'
import Broadcast from './pages/Broadcast'

// Team Pages
import TeamDashboard from './pages/TeamDashboard'
import DossierViewer from './pages/DossierViewer'
import Auction from './pages/Auction'

// Admin Pages
import AdminDashboard from './pages/AdminDashboard'
import AdminScores from './pages/AdminScores'
import AdminOps from './pages/AdminOps'
import AdminAuction from './pages/AdminAuction'
import AdminTeams from './pages/AdminTeams'
import AdminRound3 from './pages/AdminRound3'
import AdminDossiers from './pages/AdminDossiers'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<TeamLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/broadcast" element={<Broadcast />} />

          {/* Team Routes */}
          <Route element={<ProtectedRoute requiredRole="team" />}>
            <Route element={<TeamLayout />}>
              <Route path="/dashboard" element={<TeamDashboard />} />
              <Route path="/dossier/:airportId" element={<DossierViewer />} />
              <Route path="/auction" element={<Auction />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="scores" element={<AdminScores />} />
              <Route path="ops" element={<AdminOps />} />
              <Route path="auction" element={<AdminAuction />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="dossiers" element={<AdminDossiers />} />
              <Route path="round3" element={<AdminRound3 />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
