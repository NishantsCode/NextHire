import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useUser } from '../context/UserContext'
import { useToast } from '../components/ui/Toast'
import PasswordInput from '../components/ui/PasswordInput'
import FileUpload from '../components/ui/FileUpload'

export default function Register() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user'
  })
  const [resume, setResume] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const navigate = useNavigate()
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
    document.title = 'Create Account - NextHire'
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (step === 1) {
      // Step 1 validation
      if (!formData.fullname.trim()) {
        newErrors.fullname = 'Full name is required'
      } else if (formData.fullname.trim().length < 2) {
        newErrors.fullname = 'Name must be at least 2 characters'
      }
      
      if (!formData.email) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    } else {
      // Step 2 validation
      if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
      
      if (!acceptTerms) {
        newErrors.terms = 'You must accept the terms and conditions'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (validateForm()) {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast.error('Please fix the errors in the form')
    }
  }

  const handleBack = () => {
    setStep(1)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setLoading(true)

    try {
      const data = new FormData()
      data.append('fullname', formData.fullname.trim())
      data.append('email', formData.email.toLowerCase())
      data.append('password', formData.password)
      data.append('phone', formData.phone)
      data.append('role', formData.role)
      if (resume) {
        data.append('resume', resume)
      }

      const response = await register(data)
      setUser(response.user)
      toast.success('Account created successfully!')
      navigate('/jobs')
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(message)
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (userLoading) {
    return (
      <div className="auth-background">
        <div className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-4 text-slate-300">
            <svg className="spinner w-8 h-8 text-emerald-500" viewBox="0 0 24 24">
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
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-emerald-500/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 border-2 border-teal-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 border-2 border-cyan-500/20 rotate-12 animate-float" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-emerald-500/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700/30 animate-scale-in relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group" aria-label="Go to homepage">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <span className="relative text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">NextHire</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Create your account</h1>
          <p className="text-sm text-slate-400">
            {step === 1 ? 'Start your job search journey' : 'Complete your profile'}
          </p>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-1.5 w-16 rounded-full transition-all ${step === 1 ? 'bg-emerald-500' : 'bg-emerald-500/50'}`}></div>
            <div className={`h-1.5 w-16 rounded-full transition-all ${step === 2 ? 'bg-emerald-500' : 'bg-slate-700/50'}`}></div>
          </div>
        </div>

        {/* Error Alert */}
        {errors.submit && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 mb-4 animate-slide-down backdrop-blur-sm" role="alert">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{errors.submit}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-3" noValidate>
          {step === 1 ? (
            <>
              {/* Step 1: Basic Information */}
              <div className="form-group">
                <label htmlFor="fullname" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="input-icon-wrapper group">
                  <svg className="input-icon text-slate-500 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="fullname"
                    type="text"
                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border ${errors.fullname ? 'border-red-500/50 focus:border-red-500/50' : 'border-slate-700/50 focus:border-emerald-500/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.fullname ? 'focus:ring-red-500/20' : 'focus:ring-emerald-500/20'} transition-all backdrop-blur-sm hover:border-slate-600/50`}
                    placeholder="John Doe"
                    value={formData.fullname}
                    onChange={(e) => handleChange('fullname', e.target.value)}
                    aria-invalid={errors.fullname ? 'true' : 'false'}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
                {errors.fullname && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down">{errors.fullname}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="input-icon-wrapper group">
                  <svg className="input-icon text-slate-500 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border ${errors.email ? 'border-red-500/50 focus:border-red-500/50' : 'border-slate-700/50 focus:border-emerald-500/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500/20' : 'focus:ring-emerald-500/20'} transition-all backdrop-blur-sm hover:border-slate-600/50`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-800/50 border ${errors.password ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm`}
                    showStrength
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm <span className="text-red-400">*</span>
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-800/50 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm`}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Additional Information */}
              <div className="form-group">
                <label htmlFor="phone" className="block text-xs font-medium text-slate-300 mb-1.5">Phone (Optional)</label>
                <input
                  id="phone"
                  type="tel"
                  className={`w-full px-3 py-2.5 bg-slate-800/50 border ${errors.phone ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm`}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  autoComplete="tel"
                  autoFocus
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Resume (Optional)</label>
                <FileUpload
                  onFileSelect={setResume}
                  value={resume}
                  accept=".pdf,.doc,.docx"
                  maxSize={5 * 1024 * 1024}
                  label="Upload your resume"
                  hint="PDF or Word, max 5MB"
                />
              </div>

              {/* Terms checkbox */}
              <div className="form-group">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked)
                      if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }))
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800/50 text-emerald-600 focus:ring-emerald-500/50 focus:ring-offset-slate-900 transition-all"
                  />
                  <span className="text-xs text-slate-400">
                    I agree to the{' '}
                    <button type="button" className="text-emerald-400 hover:text-emerald-300 transition-colors hover:underline" onClick={() => toast.info('Terms page coming soon!')}>
                      Terms
                    </button>
                    {' '}and{' '}
                    <button type="button" className="text-emerald-400 hover:text-emerald-300 transition-colors hover:underline" onClick={() => toast.info('Privacy policy coming soon!')}>
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 animate-slide-down">{errors.terms}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-300 rounded-lg transition-all bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="spinner inline-block" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>

        {/* Compact Links */}
        <div className="text-center mt-4">
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-slate-600 bg-slate-900/50">or</span>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium hover:underline">
              Sign in
            </Link>
            {' '}or{' '}
            <Link to="/register-hr" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium hover:underline">
              Register as Employer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
