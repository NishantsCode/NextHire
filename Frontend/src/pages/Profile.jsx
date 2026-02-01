import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../api/applications';
import { logout } from '../api/auth';
import { useUser } from '../context/UserContext';
import ProfileModal from '../components/ProfileModal';
import { useToast } from '../components/ui/Toast';
import { getFileUrl } from '../config/api';

export default function Profile() {
  const { user, setUser, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'user') {
        fetchApplications();
      } else if (user.role === 'hr') {
        navigate('/dashboard');
      }
    }
  }, [user, userLoading, navigate]);

  const fetchApplications = async () => {
    try {
      const response = await getMyApplications();
      setApplications(response.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
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
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold text-white drop-shadow-lg">NextHire</span>
            </div>
            
            <div className="flex items-center gap-3">
            <button onClick={() => navigate('/jobs')} className="btn-primary text-sm">
              <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Jobs
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user.fullname.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-slate-100 hidden sm:block">{user.fullname}</span>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-1 drop-shadow-lg">My Applications</h1>
            <p className="text-slate-300">Track the status of your {applications.length} job applications</p>
          </div>

          {/* Applications Table */}
          {applications.length === 0 ? (
            <div className="glass-card rounded-2xl text-center py-12">
              <div className="w-16 h-16 bg-slate-700/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600/30">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-300 mb-4">
                You haven't applied to any jobs yet
              </p>
              <button onClick={() => navigate('/jobs')} className="btn-primary">
                Browse Available Jobs
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/30">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[18%]">Company</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[25%]">Profile</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[14%]">Applied On</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[20%]">Application Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[18%]">Review Application</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {applications.map((application) => (
                      <tr key={application._id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-100">
                            {application.jobId?.createdBy?.organizationname || 'Company'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-100">
                              {application.jobId?.title || 'Job Title'}
                            </span>
                            <button 
                              onClick={() => navigate(`/jobs?jobId=${application.jobId?._id}`)}
                              className="text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm text-slate-300">
                            {new Date(application.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`capitalize inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            application.status === 'reviewed' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                            application.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              onClick={() => {
                                setSelectedJob(application.jobId);
                                setShowJobModal(true);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="View Job Details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <a 
                              href={getFileUrl(application.resume)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`transition-colors ${application.resume ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 cursor-not-allowed'}`}
                              title="View Resume"
                              onClick={(e) => !application.resume && e.preventDefault()}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-slate-900/70 to-black/80 backdrop-blur-md" onClick={() => setShowJobModal(false)} />
          
          <div className="relative glass-strong rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="flex items-start justify-between p-8 border-b border-slate-700/30">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">{selectedJob.title}</h2>
                  {selectedJob.jobId && (
                    <p className="text-sm text-emerald-400 font-mono mt-1">
                      Job ID: {selectedJob.jobId}
                    </p>
                  )}
                  <p className="text-base text-slate-400 mt-1">
                    {selectedJob.createdBy?.organizationname || 'Company'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="p-2 hover:bg-slate-700/30 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <span className="text-emerald-400 mt-1">•</span>
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
                            <span className="text-cyan-400 mt-1">•</span>
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
                            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                Posted {new Date(selectedJob.createdAt).toLocaleDateString()}
              </span>
              <button 
                onClick={() => setShowJobModal(false)} 
                className="btn-secondary text-base px-8 py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
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
