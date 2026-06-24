import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { PageLoader } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'

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
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/new" element={<NewJobPage />} />
            <Route path="jobs/:id/edit" element={<EditJobPage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="resumes/:id" element={<ResumeDetailPage />} />
            <Route path="approved" element={<ApprovedPage />} />
            <Route path="talent-pool" element={<TalentPoolPage />} />
            <Route path="email-config" element={<EmailConfigPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
