import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login } from '../api/auth'
import { useUser } from '../context/UserContext'
import { useToast } from '../components/ui/Toast'
import PasswordInput from '../components/ui/PasswordInput'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser, loading: userLoading } = useUser()
  const toast = useToast()

  // Redirect if already logged in
  useEffect(() => {
    if (!userLoading && user) {
      navigate(user.role === 'hr' ? '/dashboard' : '/jobs')
    }
  }, [user, userLoading, navigate])

  // Set page title
  useEffect(() => {
    document.title = 'Sign In - NextHire'
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const data = await login(formData)
      setUser(data.user)
      toast.success('Welcome back!')
      
      const redirectTo = location.state?.redirectTo
      
      if (data.user.role === 'hr') {
        navigate('/dashboard')
      } else if (redirectTo) {
        navigate(redirectTo)
      } else {
        navigate('/jobs')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (userLoading) {
    return (
      <div className="auth-background">
        <div className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-4 text-slate-300">
            <svg className="spinner w-8 h-8 text-indigo-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-background">
      {/* Decorative Elements */}
      <div className="auth-decorations"></div>
      <div className="auth-grid-pattern"></div>
      <div className="auth-particle"></div>
      <div className="auth-particle"></div>
      <div className="auth-particle"></div>
      <div className="auth-particle"></div>
      <div className="auth-particle"></div>
      
      {/* Decorative Shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-indigo-500/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 border-2 border-purple-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 border-2 border-pink-500/20 rotate-12 animate-float" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-indigo-500/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700/30 animate-scale-in relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group" aria-label="Go to homepage">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <span className="relative text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">NextHire</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-400">Sign in to continue your journey</p>
        </div>

        {/* Error Alert */}
        {errors.submit && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 mb-4 animate-slide-down backdrop-blur-sm" role="alert" aria-live="polite">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{errors.submit}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
            <div className="input-icon-wrapper group">
              <svg className="input-icon text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <input
                id="email"
                type="email"
                className={`w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border ${errors.email ? 'border-red-500/50 focus:border-red-500/50' : 'border-slate-700/50 focus:border-indigo-500/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500/20' : 'focus:ring-indigo-500/20'} transition-all backdrop-blur-sm hover:border-slate-600/50`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down" role="alert">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="group">
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-800/50 border ${errors.password ? 'border-red-500/50 focus:border-red-500/50' : 'border-slate-700/50 focus:border-indigo-500/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500/20' : 'focus:ring-indigo-500/20'} transition-all backdrop-blur-sm hover:border-slate-600/50`}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="current-password"
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down" role="alert">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm font-semibold relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        {/* Compact Links */}
        <div className="text-center space-y-2 mt-4">
          <div>
            <button 
              type="button" 
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hover:underline"
              onClick={() => toast.info('Password reset feature coming soon!')}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-slate-600 bg-slate-900/50">or</span>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            New to NextHire?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline">
              Register as Job Seeker
            </Link>
            {' '}or{' '}
            <Link to="/register-hr" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline">
              Employer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
