import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './components/ui/Toast'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const RegisterHR = lazy(() => import('./pages/RegisterHR'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const JobListings = lazy(() => import('./pages/JobListings'))
const JobDetails = lazy(() => import('./pages/JobDetails'))
const Profile = lazy(() => import('./pages/Profile'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="flex items-center gap-3 text-content-secondary">
        <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-hr" element={<RegisterHR />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/jobs" element={<JobListings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/job/:jobId" element={<JobDetails />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  )
}

export default App
