import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAvailableJobs } from '../api/jobs';
import { SkeletonJobCard } from '../components/ui/SkeletonLoader';

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    document.title = 'NextHire - Find Your Dream Job';
    fetchJobs();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedJob) {
        setSelectedJob(null);
      }
    };
    
    if (selectedJob) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const response = await getAvailableJobs();
      // Show only 5 newest active jobs on home page
      const activeJobs = (response.jobs || [])
        .filter(job => job.status === 'active')
        .slice(0, 5);
      setJobs(activeJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = useCallback((jobId) => {
    navigate('/login', { state: { redirectTo: `/jobs?jobId=${jobId}` } });
  }, [navigate]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="page-container">
      <a href="#jobs" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg z-50">
        Skip to job listings
      </a>

      {/* Navigation */}
      <nav className="navbar relative z-10" role="navigation" aria-label="Main navigation">
        <div className="content-container py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center" aria-label="NextHire Home">
              <span className="text-xl font-bold text-white drop-shadow-lg">NextHire</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#jobs" className="text-sm text-white/90 hover:text-white transition-colors">Jobs</a>
              <Link to="/login" className="text-sm text-white/90 hover:text-white transition-colors">Hire Talent</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="content-container py-6 lg:py-10" aria-labelledby="hero-heading">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mb-16">
            {/* Left Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-indigo-300 font-medium">Your Career Starts Here</span>
              </div>
              
              <h1 id="hero-heading" className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Find Your
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dream Job
                </span>
              </h1>
              
              <p className="text-base lg:text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Connect with top companies and discover opportunities that match your skills and aspirations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary px-6 py-3 text-sm group">
                  <svg className="icon-md group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explore Jobs
                </Link>
                <Link to="/register-hr" className="btn-secondary px-6 py-3 text-sm group">
                  <svg className="icon-md group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Job
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-8 mt-10 justify-center lg:justify-start">
                <div>
                  <p className="text-2xl font-bold text-white">{jobs.length || '100'}+</p>
                  <p className="text-xs text-slate-400">Active Jobs</p>
                </div>
                <div className="w-px h-10 bg-slate-700"></div>
                <div>
                  <p className="text-2xl font-bold text-white">500+</p>
                  <p className="text-xs text-slate-400">Companies</p>
                </div>
                <div className="w-px h-10 bg-slate-700"></div>
                <div>
                  <p className="text-2xl font-bold text-white">10k+</p>
                  <p className="text-xs text-slate-400">Job Seekers</p>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative order-1 lg:order-2">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
              
              {/* Main illustration */}
              <div className="relative">
                <img 
                  src="https://illustrations.popsy.co/violet/work-from-home.svg" 
                  alt="Professional searching for jobs"
                  className="w-full h-auto relative z-10"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" role="list" aria-label="Features">
            <div className="glass-card glass-hover text-center p-6 rounded-2xl" role="listitem">
              <div className="w-14 h-14 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm text-slate-100 mb-2">Browse Jobs</h3>
              <p className="text-xs text-slate-300">Discover the latest job listings from top companies</p>
            </div>

            <div className="glass-card glass-hover text-center p-6 rounded-2xl" role="listitem">
              <div className="w-14 h-14 bg-emerald-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm text-slate-100 mb-2">Easy Application</h3>
              <p className="text-xs text-slate-300">Apply quickly and track all applications in one place</p>
            </div>

            <div className="glass-card glass-hover text-center p-6 rounded-2xl" role="listitem">
              <div className="w-14 h-14 bg-cyan-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm text-slate-100 mb-2">AI-Powered Matching</h3>
              <p className="text-xs text-slate-300">Smart algorithms match you with the best opportunities</p>
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <section id="jobs" className="py-16" aria-labelledby="jobs-heading">
          <div className="content-container">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
                <div>
                  <h2 id="jobs-heading" className="text-2xl font-bold text-slate-100 mb-2 drop-shadow-lg">Latest Job Openings</h2>
                  <p className="text-sm text-slate-300">
                    {jobs.length > 0 ? `${jobs.length} opportunities available` : 'Explore opportunities from top companies'}
                  </p>
                </div>
                {jobs.length > 0 && (
                  <Link to="/login" className="btn-ghost text-sm">
                    View All Jobs →
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonJobCard key={i} />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="glass-strong rounded-3xl p-16 text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-slate-700/30 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-600/30">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-100 text-lg font-medium">No jobs available at the moment</p>
                  <p className="text-slate-400 mt-2">Check back later for new opportunities</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" role="list" aria-label="Job listings">
                  {jobs.slice(0, 8).map((job) => (
                    <article
                      key={job._id}
                      onClick={() => setSelectedJob(job)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedJob(job)}
                      tabIndex={0}
                      role="listitem"
                      className="glass-card glass-hover rounded-2xl p-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      aria-label={`${job.title} at ${job.createdBy?.organizationname || 'Company'}`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-slate-100 line-clamp-1">{job.title}</h3>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {job.createdBy?.organizationname || 'Company'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {job.structuredJD?.location && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.structuredJD.location}
                          </p>
                        )}
                        {job.structuredJD?.experience && (
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.structuredJD.experience}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                        <span className="text-xs text-slate-500">
                          <time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleDateString()}</time>
                        </span>
                        <span className="text-sm text-indigo-400 font-medium">View →</span>
                      </div>
                    </article>
                  ))}
                </div>

                {jobs.length > 8 && (
                  <div className="text-center mt-10">
                    <Link to="/login" className="btn-primary text-base px-8 py-3">
                      View All {jobs.length} Jobs
                    </Link>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 py-8 border-t border-slate-800/50" role="contentinfo">
        <div className="content-container">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">© {currentYear} NextHire. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="mailto:support@nexthire.com" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Job Details Modal */}
      {selectedJob && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-modal-title"
        >
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-slate-900/70 to-black/80 backdrop-blur-md" onClick={() => setSelectedJob(null)} aria-hidden="true" />
          
          <div className="relative glass-strong rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="flex items-start justify-between p-8 border-b border-slate-700/30">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 id="job-modal-title" className="text-2xl font-bold text-slate-100">{selectedJob.title}</h2>
                  {selectedJob.jobId && (
                    <p className="text-sm text-indigo-400 font-mono mt-1">
                      Job ID: {selectedJob.jobId}
                    </p>
                  )}
                  <p className="text-base text-slate-400 mt-1">
                    {selectedJob.createdBy?.organizationname || 'Company'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-700/30 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)] space-y-6">
              {selectedJob.structuredJD ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {selectedJob.structuredJD.experience && (
                      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1">Experience</p>
                        <p className="font-medium text-sm text-slate-200">{selectedJob.structuredJD.experience}</p>
                      </div>
                    )}
                    {selectedJob.structuredJD.location && (
                      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1">Location</p>
                        <p className="font-medium text-sm text-slate-200">{selectedJob.structuredJD.location}</p>
                      </div>
                    )}
                    {selectedJob.structuredJD.employmentType && (
                      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1">Type</p>
                        <p className="font-medium text-sm text-slate-200">{selectedJob.structuredJD.employmentType}</p>
                      </div>
                    )}
                    {selectedJob.structuredJD.salary && (
                      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1">Salary</p>
                        <p className="font-medium text-sm text-slate-200">{selectedJob.structuredJD.salary}</p>
                      </div>
                    )}
                  </div>

                  {selectedJob.structuredJD.requiredSkills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-3 text-base">Required Skills</h3>
                      <p className="text-sm text-slate-300">
                        {selectedJob.structuredJD.requiredSkills.join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedJob.structuredJD.preferredSkills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-3 text-base">Preferred Skills</h3>
                      <p className="text-sm text-slate-300">
                        {selectedJob.structuredJD.preferredSkills.join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedJob.structuredJD.rolesAndResponsibilities?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-3 text-base">Responsibilities</h3>
                      <ul className="space-y-2">
                        {selectedJob.structuredJD.rolesAndResponsibilities.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-indigo-400 mt-1" aria-hidden="true">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.structuredJD.eligibility?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-3 text-base">Eligibility</h3>
                      <ul className="space-y-2">
                        {selectedJob.structuredJD.eligibility.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 mt-1" aria-hidden="true">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.structuredJD.benefits?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-3 text-base">Benefits</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedJob.structuredJD.benefits.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Job Description</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{selectedJob.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 p-8 border-t border-slate-700/30 bg-slate-900/30">
              <span className="text-sm text-slate-500">
                Posted <time dateTime={selectedJob.createdAt}>{new Date(selectedJob.createdAt).toLocaleDateString()}</time>
              </span>
              <button 
                onClick={() => handleApply(selectedJob._id)} 
                className="btn-primary text-base px-8 py-3"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
