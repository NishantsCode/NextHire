import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { logout } from '../api/auth';
import { getAvailableJobs } from '../api/jobs';
import { getAppliedJobIds } from '../api/applications';
import ApplyJobModal from '../components/ApplyJobModal';
import ProfileModal from '../components/ProfileModal';
import { useToast } from '../components/ui/Toast';

export default function JobListings() {
  const { user, setUser, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detailed'
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    jobType: '',
    search: ''
  });

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'hr') {
        navigate('/dashboard');
      } else {
        fetchJobs();
        fetchAppliedJobs();
      }
    }
  }, [user, userLoading, navigate]);

  const fetchJobs = async () => {
    try {
      const response = await getAvailableJobs();
      setAvailableJobs(response.jobs);
      const jobIdFromUrl = searchParams.get('jobId');
      if (jobIdFromUrl) {
        const jobToSelect = response.jobs.find(job => job._id === jobIdFromUrl);
        if (jobToSelect) {
          setSelectedJob(jobToSelect);
          setViewMode('detailed'); // Switch to detailed view to show the job
        } else {
          setSelectedJob(response.jobs[0] || null);
        }
      } else if (response.jobs.length > 0) {
        setSelectedJob(response.jobs[0]);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const response = await getAppliedJobIds();
      setAppliedJobIds(response.appliedJobIds || []);
    } catch (err) {
      console.error('Failed to fetch applied jobs:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplyModal(false);
    fetchAppliedJobs();
  };

  const isJobApplied = (jobId) => appliedJobIds.includes(jobId);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    const alreadyApplied = isJobApplied(job._id);
    setIsAlreadyApplied(alreadyApplied);
    setShowApplyModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ location: '', experience: '', jobType: '', search: '' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const filteredJobs = availableJobs.filter(job => {
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.structuredJD?.requiredSkills?.some(skill => 
        skill.toLowerCase().includes(filters.search.toLowerCase())
      );
    
    const matchesLocation = !filters.location || 
      job.structuredJD?.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesJobType = !filters.jobType || 
      job.structuredJD?.employmentType?.toLowerCase() === filters.jobType.toLowerCase();
    
    return matchesSearch && matchesLocation && matchesJobType;
  });

  if (userLoading || loading) {
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
    );
  }

  if (!user || user.role !== 'user') return null;

  return (
    <div className="page-container">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed"></div>
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
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-48 lg:w-64 bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-md"
              />
            </div>

            <button onClick={() => navigate('/profile')} className="btn-secondary text-sm hidden sm:flex">
              <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Applications
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user.fullname.charAt(0).toUpperCase()}
                </div>
                <svg className="icon-sm text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-lg z-[110] animate-slide-down overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700/50">
                      <p className="font-medium text-sm text-slate-100">{user.fullname}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/30 transition-colors flex items-center gap-2.5 text-sm"
                    >
                      <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 text-sm"
                    >
                      <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="content-container py-6 relative z-0">
        {/* Header with View Toggle */}
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1 drop-shadow-lg">Available Jobs</h1>
              <p className="text-slate-300">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} available
              </p>
            </div>
            
            {viewMode === 'grid' && (
              <button
                onClick={() => setViewMode('detailed')}
                className="btn-secondary text-sm"
              >
                <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                View All with Filters
              </button>
            )}
            
            {viewMode === 'detailed' && (
              <button
                onClick={() => setViewMode('grid')}
                className="btn-secondary text-sm"
              >
                <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid View
              </button>
            )}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="max-w-7xl mx-auto">
            <div className="glass-card rounded-2xl text-center py-16">
              <div className="w-16 h-16 bg-slate-700/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600/30">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-300">
                {activeFilterCount > 0 ? 'No jobs match your filters' : 'No jobs available at the moment'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Check back later for new opportunities'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-ghost text-sm mt-3">
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - Like Home Page */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredJobs.map((job) => (
              <article
                key={job._id}
                onClick={() => job.status !== 'closed' && handleApplyClick(job)}
                className={`glass-card glass-hover rounded-2xl p-5 ${job.status !== 'closed' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-slate-100 line-clamp-1">{job.title}</h3>
                    {job.jobId && (
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">
                        {job.jobId}
                      </p>
                    )}
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {job.createdBy?.organizationname || 'Company'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {job.structuredJD?.location && (
                    <p className="text-sm text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {job.structuredJD.location}
                    </p>
                  )}
                  {job.structuredJD?.experience && (
                    <p className="text-sm text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.structuredJD.experience}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                  {isJobApplied(job._id) ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      ✓ Applied
                    </span>
                  ) : job.status === 'closed' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      Closed
                    </span>
                  ) : (
                    <span className="text-sm text-emerald-400 font-medium">Apply →</span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Detailed View with Filters */
          <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-11 gap-4">
            {/* Job List */}
            <div className="lg:col-span-4">
              {/* Filter Button - directly above job cards */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="btn-ghost text-xs flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700/50 rounded-lg"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="bg-emerald-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {showFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowFilterDropdown(false)} />
                      <div className="absolute left-0 mt-2 w-64 glass-strong rounded-xl shadow-lg z-[110] animate-slide-down overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-100">Filter Jobs</span>
                          {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-xs text-emerald-400 hover:text-emerald-300">
                              Clear all
                            </button>
                          )}
                        </div>
                        
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
                            <select
                              value={filters.location}
                              onChange={(e) => handleFilterChange('location', e.target.value)}
                              className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              <option value="">All Locations</option>
                              <option value="remote">Remote</option>
                              <option value="onsite">On-site</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience Level</label>
                            <select
                              value={filters.experience}
                              onChange={(e) => handleFilterChange('experience', e.target.value)}
                              className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              <option value="">All Levels</option>
                              <option value="fresher">Fresher</option>
                              <option value="1-3">1-3 Years</option>
                              <option value="3-5">3-5 Years</option>
                              <option value="5+">5+ Years</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Type</label>
                            <select
                              value={filters.jobType}
                              onChange={(e) => handleFilterChange('jobType', e.target.value)}
                              className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              <option value="">All Types</option>
                              <option value="full-time">Full-time</option>
                              <option value="part-time">Part-time</option>
                              <option value="contract">Contract</option>
                              <option value="internship">Internship</option>
                            </select>
                          </div>
                        </div>

                        <div className="px-4 py-3 border-t border-slate-700/50">
                          <button
                            onClick={() => setShowFilterDropdown(false)}
                            className="w-full btn-primary text-sm"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Job Cards */}
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className={`glass-card glass-hover rounded-2xl cursor-pointer transition-all p-4 ${
                    selectedJob?._id === job._id
                      ? 'ring-2 ring-emerald-500/50 border-emerald-500/50'
                      : ''
                  }`}
                >
                  <h3 className="font-semibold text-emerald-400 mb-1 line-clamp-1 text-sm">{job.title}</h3>
                  {job.jobId && (
                    <p className="text-xs text-emerald-400/70 font-mono mb-1">
                      {job.jobId}
                    </p>
                  )}
                  <p className="text-xs text-slate-300 mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {job.createdBy?.organizationname || 'Company'}
                  </p>
                  
                  {job.structuredJD && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
                      {job.structuredJD.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {job.structuredJD.location}
                        </span>
                      )}
                      {job.structuredJD.experience && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.structuredJD.experience}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                    {isJobApplied(job._id) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">✓ Applied</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 capitalize">{job.status}</span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="lg:col-span-7">
              {selectedJob ? (
                <div className="glass-card rounded-2xl sticky top-20 p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 bg-emerald-500/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-slate-100 mb-1">{selectedJob.title}</h2>
                      {selectedJob.jobId && (
                        <p className="text-sm text-emerald-400 font-mono mb-1">
                          Job ID: {selectedJob.jobId}
                        </p>
                      )}
                      <p className="text-slate-300 text-sm">{selectedJob.createdBy?.organizationname || 'Company'}</p>
                    </div>
                    {isJobApplied(selectedJob._id) ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        ✓ Applied
                      </span>
                    ) : selectedJob.status === 'closed' ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        No Longer Accepting
                      </span>
                    ) : (
                      <button onClick={() => handleApplyClick(selectedJob)} className="btn-success text-sm px-4 py-1.5">
                        Apply Now
                      </button>
                    )}
                  </div>

                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-5">
                    {selectedJob.structuredJD ? (
                      <>
                        {/* Quick Info */}
                        <div className="grid grid-cols-2 gap-3">
                          {selectedJob.structuredJD.location && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                              <p className="text-xs text-slate-400 mb-0.5">Location</p>
                              <p className="font-medium text-sm text-slate-100">{selectedJob.structuredJD.location}</p>
                            </div>
                          )}
                          {selectedJob.structuredJD.employmentType && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                              <p className="text-xs text-slate-400 mb-0.5">Employment Type</p>
                              <p className="font-medium text-sm text-slate-100 capitalize">{selectedJob.structuredJD.employmentType}</p>
                            </div>
                          )}
                          {selectedJob.structuredJD.experience && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                              <p className="text-xs text-slate-400 mb-0.5">Experience</p>
                              <p className="font-medium text-sm text-slate-100">{selectedJob.structuredJD.experience}</p>
                            </div>
                          )}
                          {selectedJob.structuredJD.salary && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                              <p className="text-xs text-slate-400 mb-0.5">Salary/Stipend</p>
                              <p className="font-medium text-sm text-slate-100">{selectedJob.structuredJD.salary}</p>
                            </div>
                          )}
                        </div>

                        {/* Eligibility (Education & Experience) */}
                        {selectedJob.structuredJD.eligibility?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Eligibility (Education & Experience)</h3>
                            <ul className="space-y-1.5">
                              {selectedJob.structuredJD.eligibility.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-emerald-400 mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Required Skills */}
                        {selectedJob.structuredJD.requiredSkills?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Required Skills</h3>
                            <p className="text-sm text-slate-300">
                              {selectedJob.structuredJD.requiredSkills.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Good to Have */}
                        {selectedJob.structuredJD.preferredSkills?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Good to Have</h3>
                            <p className="text-sm text-slate-300">
                              {selectedJob.structuredJD.preferredSkills.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Roles & Responsibilities */}
                        {selectedJob.structuredJD.rolesAndResponsibilities?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Roles & Responsibilities</h3>
                            <ul className="space-y-1.5">
                              {selectedJob.structuredJD.rolesAndResponsibilities.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-emerald-400 mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Benefits */}
                        {selectedJob.structuredJD.benefits?.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Benefits</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedJob.structuredJD.benefits.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                  <svg className="icon-sm text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Information */}
                        {selectedJob.structuredJD.additionalInfo && selectedJob.structuredJD.additionalInfo.trim() && (
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-2 text-sm">Additional Information</h3>
                            <p className="text-sm text-slate-300 whitespace-pre-line">{selectedJob.structuredJD.additionalInfo}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-2 text-sm">Job Description</h3>
                        <p className="text-sm text-slate-300 whitespace-pre-line">{selectedJob.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-700/30">
                    <span className="text-xs text-slate-500">
                      Posted {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </span>
                    {!isJobApplied(selectedJob._id) && selectedJob.status !== 'closed' && (
                      <button onClick={() => handleApplyClick(selectedJob)} className="btn-success text-sm ml-auto">
                        Apply for this Position
                      </button>
                    )}
                    {selectedJob.status === 'closed' && !isJobApplied(selectedJob._id) && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 ml-auto">
                        No Longer Accepting Applications
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl text-center py-16">
                  <p className="text-slate-400">Select a job to view details</p>
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={selectedJob}
        onSuccess={handleApplicationSuccess}
        isAlreadyApplied={isAlreadyApplied}
      />
      
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdate={(updatedUser) => {
          setUser(updatedUser);
          toast.success('Profile updated successfully!');
        }}
      />
    </div>
  );
}
