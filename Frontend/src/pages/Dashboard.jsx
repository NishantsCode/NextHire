import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { logout } from '../api/auth'
import { getJobs, deleteJob, updateJob } from '../api/jobs'
import { useToast } from '../components/ui/Toast'
import { ConfirmModal } from '../components/ui'
import { SkeletonStats, SkeletonCard } from '../components/ui/SkeletonLoader'
import { EmptyJobs } from '../components/ui/EmptyState'
import ProfileModal from '../components/ProfileModal'
import CreateJobModal from '../components/CreateJobModal'

export default function Dashboard() {
  const { user, setUser, loading } = useUser()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'closed'
  
  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState({ open: false, jobId: null, jobTitle: '' })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard - NextHire'
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchJobs()
    }
  }, [user])

  const fetchJobs = async () => {
    try {
      const response = await getJobs()
      setJobs(response.jobs)
    } catch (err) {
      toast.error('Failed to load jobs')
    } finally {
      setJobsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  const openDeleteModal = (job) => {
    setDeleteModal({ open: true, jobId: job._id, jobTitle: job.title })
  }

  const handleDeleteJob = async () => {
    setDeleting(true)
    try {
      await deleteJob(deleteModal.jobId)
      toast.success('Job deleted successfully')
      fetchJobs()
    } catch (err) {
      toast.error('Failed to delete job')
    } finally {
      setDeleting(false)
      setDeleteModal({ open: false, jobId: null, jobTitle: '' })
    }
  }

  // Filter jobs based on search and status
  const filteredJobs = useMemo(() => {
    let filtered = jobs
    
    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(job => job.status === 'active')
    } else if (statusFilter === 'closed') {
      filtered = filtered.filter(job => job.status === 'closed')
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.structuredJD?.location?.toLowerCase().includes(query) ||
        job.status.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [jobs, searchQuery, statusFilter])

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    closed: jobs.filter(j => j.status === 'closed').length,
  }), [jobs])

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex items-center gap-3 text-content-secondary">
          <svg className="spinner w-6 h-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    )
  }

  if (!user) return null
  if (user.role !== 'hr') {
    navigate('/')
    return null
  }

  return (
    <div className="page-container">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar relative z-50">
        <div className="content-container py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white drop-shadow-lg">NextHire</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="hidden sm:block relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 backdrop-blur-md"
                  aria-label="Search jobs"
                />
              </div>

              <button
                onClick={() => setShowCreateJobModal(true)}
                className="btn-primary text-sm"
              >
                <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Create Job</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-700/30 transition-colors"
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {user.fullname.charAt(0).toUpperCase()}
                  </div>
                  <svg className="icon-sm text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-lg z-[110] animate-slide-down overflow-hidden" role="menu">
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <p className="font-medium text-sm text-slate-100">{user.fullname}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileModal(true)
                          setShowProfileDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-100 hover:bg-slate-700/30 transition-colors flex items-center gap-2.5 text-sm"
                        role="menuitem"
                      >
                        <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </button>
                      <div className="border-t border-slate-700/50" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 text-sm"
                        role="menuitem"
                      >
                        <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="content-container py-8 relative z-0">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-100 mb-1 drop-shadow-lg">Welcome back, {user.fullname}!</h1>
            <p className="text-slate-300 flex items-center gap-2">
              <svg className="icon-md text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {user.organizationname}
            </p>
          </div>

        {/* Stats Cards */}
        {jobsLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            <button
              onClick={() => setStatusFilter('all')}
              className={`glass-card rounded-2xl p-5 text-left transition-all ${
                statusFilter === 'all' 
                  ? 'ring-2 ring-indigo-500 glass-hover' 
                  : 'hover:ring-2 hover:ring-indigo-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('active')}
              className={`glass-card rounded-2xl p-5 text-left transition-all ${
                statusFilter === 'active' 
                  ? 'ring-2 ring-emerald-500 glass-hover' 
                  : 'hover:ring-2 hover:ring-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('closed')}
              className={`glass-card rounded-2xl p-5 text-left transition-all ${
                statusFilter === 'closed' 
                  ? 'ring-2 ring-amber-500 glass-hover' 
                  : 'hover:ring-2 hover:ring-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Closed Jobs</p>
                  <p className="text-3xl font-bold text-amber-400">{stats.closed}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-amber-500/30">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Job Postings Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            {statusFilter === 'all' ? 'Your Job Postings' : 
             statusFilter === 'active' ? 'Active Job Postings' : 
             'Closed Job Postings'}
            {(searchQuery || statusFilter !== 'all') && filteredJobs.length !== jobs.length && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({filteredJobs.length} of {jobs.length})
              </span>
            )}
          </h2>
          {jobs.length > 0 && (
            <button onClick={() => setShowCreateJobModal(true)} className="btn-ghost text-sm">
              + Add New
            </button>
          )}
        </div>
        
        {jobsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyJobs onAction={() => setShowCreateJobModal(true)} />
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card rounded-2xl text-center py-12">
            <p className="text-slate-300 mb-2">No jobs match "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="btn-ghost text-sm">
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map((job) => (
              <div key={job._id} className="glass-card glass-hover rounded-2xl p-4">
                {/* Upper Section - Job Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base text-slate-100 line-clamp-2 flex-1">
                      {job.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      job.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                      job.status === 'closed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  {job.jobId && (
                    <p className="text-xs text-indigo-400 font-mono mb-3">
                      {job.jobId}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {job.structuredJD?.location && (
                      <p className="text-sm text-slate-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="line-clamp-1">{job.structuredJD.location}</span>
                      </p>
                    )}
                    {job.structuredJD?.experience && (
                      <p className="text-sm text-slate-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="line-clamp-1">{job.structuredJD.experience}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Lower Section - Date and Actions */}
                <div className="text-xs text-slate-500 mb-4 pt-3 border-t border-slate-700/30">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="flex-1 text-xs py-2 px-3 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium border border-indigo-500/30"
                    aria-label={`View details for ${job.title}`}
                  >
                    View Details
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const newStatus = job.status === 'active' ? 'closed' : 'active';
                        await updateJob(job._id, { status: newStatus });
                        toast.success(`Job ${newStatus === 'active' ? 'activated' : 'closed'} successfully`);
                        fetchJobs();
                      } catch (err) {
                        toast.error('Failed to update job status');
                      }
                    }}
                    className={`text-xs py-2 px-2 rounded-lg transition-colors ${
                      job.status === 'active' 
                        ? 'text-amber-400 hover:bg-amber-500/10' 
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                    title={job.status === 'active' ? 'Close Job' : 'Activate Job'}
                    aria-label={`${job.status === 'active' ? 'Close' : 'Activate'} ${job.title}`}
                  >
                    {job.status === 'active' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => openDeleteModal(job)}
                    className="text-xs py-2 px-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label={`Delete ${job.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user}
        onProfileUpdate={(updatedUser) => {
          setUser(updatedUser);
          toast.success('Profile updated successfully!');
        }}
      />
      <CreateJobModal 
        isOpen={showCreateJobModal} 
        onClose={() => setShowCreateJobModal(false)} 
        onJobCreated={() => {
          fetchJobs()
          toast.success('Job created successfully!')
        }} 
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, jobId: null, jobTitle: '' })}
        onConfirm={handleDeleteJob}
        title="Delete Job Posting"
        message={`Are you sure you want to delete "${deleteModal.jobTitle}"? This action cannot be undone and all applications will be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
