import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { PageLoader } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'
import { useCurrentUser, UserRole } from './hooks/useCurrentUser'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const JobsPage = lazy(() => import('./pages/Jobs/JobsPage'))
const NewJobPage = lazy(() => import('./pages/Jobs/NewJobPage'))
const EditJobPage = lazy(() => import('./pages/Jobs/EditJobPage'))
const ResumesPage = lazy(() => import('./pages/Resumes/ResumesPage'))
const ResumeDetailPage = lazy(() => import('./pages/Resumes/ResumeDetailPage'))
const ApprovedPage = lazy(() => import('./pages/Approved/ApprovedPage'))
const TalentPoolPage = lazy(() => import('./pages/TalentPool/TalentPoolPage'))
const EmailConfigPage = lazy(() => import('./pages/EmailConfig/EmailConfigPage'))
const UsersPage = lazy(() => import('./pages/Users/UsersPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { role, isLoading } = useCurrentUser()
  if (isLoading) return <PageLoader />
  if (role && !roles.includes(role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const FULL_ACCESS: UserRole[] = ['ADMIN', 'RECRUITER']
const ADMIN_ONLY: UserRole[] = ['ADMIN']

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<RoleRoute roles={FULL_ACCESS}><JobsPage /></RoleRoute>} />
            <Route path="jobs/new" element={<RoleRoute roles={FULL_ACCESS}><NewJobPage /></RoleRoute>} />
            <Route path="jobs/:id/edit" element={<RoleRoute roles={FULL_ACCESS}><EditJobPage /></RoleRoute>} />
            <Route path="resumes" element={<RoleRoute roles={FULL_ACCESS}><ResumesPage /></RoleRoute>} />
            <Route path="resumes/:id" element={<RoleRoute roles={FULL_ACCESS}><ResumeDetailPage /></RoleRoute>} />
            <Route path="approved" element={<RoleRoute roles={FULL_ACCESS}><ApprovedPage /></RoleRoute>} />
            <Route path="talent-pool" element={<RoleRoute roles={FULL_ACCESS}><TalentPoolPage /></RoleRoute>} />
            <Route path="email-config" element={<RoleRoute roles={ADMIN_ONLY}><EmailConfigPage /></RoleRoute>} />
            <Route path="users" element={<RoleRoute roles={FULL_ACCESS}><UsersPage /></RoleRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
