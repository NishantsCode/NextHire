import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../components/ui/Toast';
import { getJobById, updateJob, deleteJob } from '../api/jobs';
import { getApplicationsByJob, updateApplicationStatus, calculateATSScore, calculateJobATSScores, bulkUpdateStatus } from '../api/applications';
import { ConfirmModal } from '../components/ui';
import { getFileUrl } from '../config/api';

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'applicants'
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Applicants tab state
  const [calculatingATS, setCalculatingATS] = useState(false);
  const [calculatingBulk, setCalculatingBulk] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetchApplications();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await getJobById(jobId);
      setJob(response.job);
    } catch (err) {
      toast.error('Failed to load job details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await getApplicationsByJob(jobId);
      // Sort applications by ATS score (highest first), then by date
      const sortedApplications = response.applications.sort((a, b) => {
        if (a.atsScore?.score && b.atsScore?.score) {
          return b.atsScore.score - a.atsScore.score;
        }
        if (a.atsScore?.score) return -1;
        if (b.atsScore?.score) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setApplications(sortedApplications);
    } catch (err) {
      // Error fetching applications
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      toast.success('Status updated successfully');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCalculateATS = async (applicationId) => {
    setCalculatingATS(applicationId);
    try {
      await calculateATSScore(applicationId);
      toast.success('ATS score calculated');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to calculate ATS score');
    } finally {
      setCalculatingATS(false);
    }
  };

  const handleCalculateAllATS = async () => {
    setCalculatingBulk(true);
    try {
      const response = await calculateJobATSScores(jobId);
      setApplications(response.applications);
      toast.success('All ATS scores calculated');
    } catch (err) {
      toast.error('Failed to calculate ATS scores');
    } finally {
      setCalculatingBulk(false);
    }
  };

  const handleSelectApplicant = (applicationId) => {
    setSelectedApplicants(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplicants.length === applications.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(applications.map(app => app._id));
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedApplicants.length === 0) return;
    try {
      await bulkUpdateStatus(selectedApplicants, status);
      setSelectedApplicants([]);
      setShowBulkActions(false);
      toast.success(`${selectedApplicants.length} applicants updated`);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update statuses');
    }
  };

  const handleStatusToggle = async () => {
    try {
      const newStatus = job.status === 'active' ? 'closed' : 'active';
      await updateJob(jobId, { status: newStatus });
      setJob({ ...job, status: newStatus });
      toast.success(`Job ${newStatus === 'active' ? 'activated' : 'closed'} successfully`);
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteJob(jobId);
      toast.success('Job deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete job');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleViewApplicant = (applicationId) => {
    // No longer needed - removed navigation
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="spinner w-6 h-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Header */}
      <nav className="navbar relative z-50">
        <div className="content-container py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">{job.title}</h1>
                <p className="text-sm text-slate-300">Job ID: {job.jobId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                job.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {job.status}
              </span>
              
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="btn-secondary text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  Actions
                </button>
                
                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-xl z-[210] overflow-hidden border border-slate-600/50">
                      <button
                        onClick={() => {
                          handleStatusToggle();
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/30 transition-colors text-sm flex items-center gap-2"
                      >
                        {job.status === 'active' ? (
                          <>
                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Close Job
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate Job
                          </>
                        )}
                      </button>
                      <div className="border-t border-slate-700/50" />
                      <button
                        onClick={() => {
                          setDeleteModal(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Job
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="relative z-40">
        <div className="content-container">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Job Details
              </button>
              <button
                onClick={() => setActiveTab('applicants')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'applicants'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Applicants ({applications.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-container py-8 relative z-0">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'details' ? (
            <JobDetailsTab job={job} />
          ) : (
            <ApplicantsTab 
              applications={applications}
              calculatingATS={calculatingATS}
              calculatingBulk={calculatingBulk}
              expandedRow={expandedRow}
              selectedApplicants={selectedApplicants}
              showBulkActions={showBulkActions}
              onCalculateATS={handleCalculateATS}
              onCalculateAllATS={handleCalculateAllATS}
              onStatusChange={handleStatusChange}
              onSelectApplicant={handleSelectApplicant}
              onSelectAll={handleSelectAll}
              onBulkStatusUpdate={handleBulkStatusUpdate}
              onToggleExpanded={setExpandedRow}
              onToggleBulkActions={setShowBulkActions}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Job Posting"
        message={`Are you sure you want to delete "${job.title}"? This action cannot be undone and all applications will be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

// Job Details Tab Component
function JobDetailsTab({ job }) {
  const handleDownloadJD = () => {
    if (job.jdFile?.path) {
      const fileUrl = getFileUrl(job.jdFile.path);
      const link = document.createElement('a');
      link.href = fileUrl;
      
      // Use original filename or generate one based on mimetype
      let filename = job.jdFile.originalname || job.jdFile.originalName;
      if (!filename) {
        const extension = job.jdFile.mimetype === 'text/plain' ? 'txt' : 'pdf';
        filename = `job-description.${extension}`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="glass-card glass-hover rounded-2xl p-6">
        {/* Overview Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Overview</h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {job.structuredJD?.location && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-slate-500">Location:</span>
                <span className="text-slate-100">{job.structuredJD.location}</span>
              </div>
            )}
            {job.structuredJD?.experience && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-500">Experience:</span>
                <span className="text-slate-100">{job.structuredJD.experience}</span>
              </div>
            )}
            {job.structuredJD?.salary && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-500">Stipend:</span>
                <span className="text-slate-100">{job.structuredJD.salary}</span>
              </div>
            )}
            {job.structuredJD?.employmentType && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-slate-500">Type:</span>
                <span className="text-slate-100 capitalize">{job.structuredJD.employmentType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility */}
        {job.structuredJD?.eligibility?.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-700/30">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Eligibility</h2>
            <ul className="space-y-2.5">
              {job.structuredJD.eligibility.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-300 flex items-start gap-3">
                  <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Skills */}
        {job.structuredJD?.requiredSkills?.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-700/30">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Required Skills</h2>
            <p className="text-sm text-slate-300">{job.structuredJD.requiredSkills.join(', ')}</p>
          </div>
        )}

        {/* Preferred Skills */}
        {job.structuredJD?.preferredSkills?.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-700/30">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Preferred Skills</h2>
            <p className="text-sm text-slate-300">{job.structuredJD.preferredSkills.join(', ')}</p>
          </div>
        )}

        {/* Responsibilities */}
        {job.structuredJD?.rolesAndResponsibilities?.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-700/30">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Roles & Responsibilities</h2>
            <ul className="space-y-2.5">
              {job.structuredJD.rolesAndResponsibilities.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-300 flex items-start gap-3">
                  <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.structuredJD?.benefits?.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-700/30">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Benefits</h2>
            <ul className="space-y-2.5">
              {job.structuredJD.benefits.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-300 flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Info */}
        {job.structuredJD?.additionalInfo && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Additional Information</h2>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{job.structuredJD.additionalInfo}</p>
          </div>
        )}

        {/* Uploaded JD File */}
        {job.jdFile && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-slate-100">Job Description File</p>
              <p className="text-xs text-slate-500 mt-0.5">{job.jdFile.originalname}</p>
            </div>
            <button
              onClick={handleDownloadJD}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        )}
      </div>
  );
}

// Applicants Tab Component
function ApplicantsTab({ 
  applications, 
  calculatingATS,
  calculatingBulk,
  expandedRow,
  selectedApplicants,
  showBulkActions,
  onCalculateATS,
  onCalculateAllATS,
  onStatusChange,
  onSelectApplicant,
  onSelectAll,
  onBulkStatusUpdate,
  onToggleExpanded,
  onToggleBulkActions
}) {
  if (applications.length === 0) {
    return (
      <div className="glass-card rounded-2xl text-center py-12">
        <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">No Applicants Yet</h3>
        <p className="text-sm text-slate-400">No one has applied to this position yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card glass-hover rounded-2xl overflow-hidden">
      {/* Header with Actions - Inside the card */}
      <div className="p-5 border-b border-slate-700/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              All Applicants ({applications.length})
            </h2>
            {applications.some(app => app.atsScore?.score) && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Ranked by ATS Score
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {selectedApplicants.length > 0 && (
              <>
                <span className="text-sm text-slate-400">
                  {selectedApplicants.length} selected
                </span>
                <div className="relative z-50">
                  <button
                    onClick={() => onToggleBulkActions(!showBulkActions)}
                    className="btn-secondary text-sm"
                  >
                    Bulk Actions
                  </button>
                  
                  {showBulkActions && (
                    <>
                      <div className="fixed inset-0 z-[200]" onClick={() => onToggleBulkActions(false)} />
                      <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-xl z-[210] overflow-hidden border border-slate-600/50">
                        <button
                          onClick={() => onBulkStatusUpdate('reviewed')}
                          className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/30 transition-colors text-sm"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => onBulkStatusUpdate('shortlisted')}
                          className="w-full text-left px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => onBulkStatusUpdate('rejected')}
                          className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            
            <button
              onClick={onCalculateAllATS}
              disabled={calculatingBulk}
              className="btn-primary text-sm"
            >
              {calculatingBulk ? (
                <>
                  <svg className="spinner w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Calculate All ATS
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedApplicants.length === applications.length}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Candidate</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Exp</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Resume</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ATS Score</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Applied</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <>
                  <tr key={app._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedApplicants.includes(app._id)}
                        onChange={() => onSelectApplicant(app._id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      {app.atsScore?.score ? (
                        <span className={`text-sm font-semibold ${
                          index < 3 ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {app.fullname.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-100">{app.fullname}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-300">{app.email}</div>
                      {app.phone && <div className="text-xs text-slate-500">{app.phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {app.yearsOfExperience} yrs
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {app.resume ? (
                        <a
                          href={getFileUrl(app.resume.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View
                        </a>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {app.atsScore ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold ${
                          app.atsScore.score >= 80 ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' :
                          app.atsScore.score >= 60 ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30' :
                          app.atsScore.score >= 40 ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30' :
                          'text-red-400 bg-red-500/20 border border-red-500/30'
                        }`}>
                          {app.atsScore.score}%
                        </span>
                      ) : (
                        <button
                          onClick={() => onCalculateATS(app._id)}
                          disabled={calculatingATS === app._id}
                          className="btn-ghost text-xs py-1 px-2"
                        >
                          {calculatingATS === app._id ? (
                            <svg className="spinner w-4 h-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : 'Calculate'}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={app.status}
                        onChange={(e) => onStatusChange(app._id, e.target.value)}
                        className={`text-xs py-1.5 px-3 rounded-full cursor-pointer capitalize font-medium bg-transparent ${
                          app.status === 'pending' ? 'text-amber-400 border border-amber-500/30' :
                          app.status === 'reviewed' ? 'text-cyan-400 border border-cyan-500/30' :
                          app.status === 'shortlisted' ? 'text-emerald-400 border border-emerald-500/30' :
                          'text-red-400 border border-red-500/30'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleExpanded(expandedRow === app._id ? null : app._id)}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        {expandedRow === app._id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRow === app._id && (
                    <tr className="bg-slate-800/30">
                      <td colSpan="10" className="py-4 px-4">
                        <div className="space-y-4">
                          {app.coverLetter && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-100 mb-2">Cover Letter</h4>
                              <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                                {app.coverLetter}
                              </p>
                            </div>
                          )}
                          {app.atsScore && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-100 mb-2">ATS Analysis</h4>
                              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30 space-y-3">
                                <p className="text-sm text-slate-300">{app.atsScore.analysis}</p>
                                {app.atsScore.recommendations && (
                                  <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/30">
                                    <p className="text-xs font-semibold text-indigo-400 mb-1">Recommendation</p>
                                    <p className="text-sm text-slate-300">{app.atsScore.recommendations}</p>
                                  </div>
                                )}
                                <div className="grid md:grid-cols-2 gap-4">
                                  {app.atsScore.matchedSkills?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Matched Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        {app.atsScore.matchedSkills.map((skill, idx) => (
                                          <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {app.atsScore.missingSkills?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-red-400 mb-2">✗ Missing Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        {app.atsScore.missingSkills.map((skill, idx) => (
                                          <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {app.atsScore.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-2">Strengths</p>
                                    <ul className="space-y-1">
                                      {app.atsScore.strengths.map((strength, idx) => (
                                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                          <span className="text-emerald-400">•</span>
                                          {strength}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
