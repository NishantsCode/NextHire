import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationsByJob, updateApplicationStatus, calculateATSScore, calculateJobATSScores, bulkUpdateStatus } from '../api/applications';
import { getFileUrl } from '../config/api';

export default function JobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculatingATS, setCalculatingATS] = useState(false);
  const [calculatingBulk, setCalculatingBulk] = useState(false);
  const [atsError, setAtsError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const response = await getApplicationsByJob(jobId);
      // Sort applications by ATS score (highest first), then by date
      const sortedApplications = response.applications.sort((a, b) => {
        // If both have ATS scores, sort by score (descending)
        if (a.atsScore?.score && b.atsScore?.score) {
          return b.atsScore.score - a.atsScore.score;
        }
        // If only one has ATS score, prioritize it
        if (a.atsScore?.score) return -1;
        if (b.atsScore?.score) return 1;
        // If neither has ATS score, sort by application date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setApplications(sortedApplications);
      setJob(response.job);
    } catch (err) {
      // Error fetching applications
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      fetchApplications();
    } catch (err) {
      // Error updating status
    }
  };

  const handleCalculateATS = async (applicationId) => {
    setCalculatingATS(applicationId);
    setAtsError('');
    try {
      await calculateATSScore(applicationId);
      fetchApplications();
    } catch (err) {
      setAtsError('Failed to calculate ATS score');
    } finally {
      setCalculatingATS(false);
    }
  };

  const handleCalculateAllATS = async () => {
    setCalculatingBulk(true);
    setAtsError('');
    try {
      const response = await calculateJobATSScores(jobId);
      setApplications(response.applications);
    } catch (err) {
      setAtsError('Failed to calculate ATS scores');
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
      fetchApplications();
    } catch (err) {
      // Error updating statuses
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      reviewed: 'badge-info',
      shortlisted: 'badge-success',
      rejected: 'badge-danger',
    };
    return styles[status] || 'badge-neutral';
  };

  const getATSScoreColor = (score) => {
    if (score >= 80) return 'text-success-600 bg-success-50';
    if (score >= 60) return 'text-info-600 bg-info-50';
    if (score >= 40) return 'text-warning-600 bg-warning-50';
    return 'text-danger-600 bg-danger-50';
  };

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
    );
  }

  return (
    <div className="page-container">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar relative z-10">
        <div className="content-container py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold text-white drop-shadow-lg">NextHire</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
            <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="content-container py-6 relative z-10">
        {/* Job Header */}
        {job && (
          <div className="glass-card glass-hover rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100 mb-1">{job.title}</h1>
                  {job.jobId && (
                    <p className="text-sm text-indigo-400 font-mono mb-1">
                      Job ID: {job.jobId}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
                    {job.structuredJD?.experience && ` • ${job.structuredJD.experience}`}
                    {job.structuredJD?.location && ` • ${job.structuredJD.location}`}
                  </p>
                  {applications.some(app => app.atsScore?.score) && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Ranked by ATS Score
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleCalculateAllATS}
                disabled={calculatingBulk || applications.length === 0}
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
            
            {atsError && (
              <div className="alert-error mt-4">
                <svg className="icon-md" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{atsError}</span>
              </div>
            )}
          </div>
        )}

        {/* Applications Table */}
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">Applications</h2>
            
            {/* Bulk Actions */}
            {selectedApplicants.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {selectedApplicants.length} selected
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="btn-secondary text-sm"
                  >
                    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Bulk Actions
                  </button>
                  
                  {showBulkActions && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowBulkActions(false)} />
                      <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-lg z-[110] overflow-hidden">
                        <button
                          onClick={() => handleBulkStatusUpdate('reviewed')}
                          className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/30 transition-colors text-sm"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('shortlisted')}
                          className="w-full text-left px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('rejected')}
                          className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600/30">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-400">No applications received yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={selectedApplicants.length === applications.length && applications.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
                      />
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Rank</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Candidate</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Experience</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Resume</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">ATS Score</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide">Applied</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => (
                    <>
                      <tr key={app._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 px-6">
                          <input
                            type="checkbox"
                            checked={selectedApplicants.includes(app._id)}
                            onChange={() => handleSelectApplicant(app._id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
                          />
                        </td>
                        <td className="py-3 px-6">
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
                        <td className="py-3 px-6">
                          <span className="font-medium text-slate-100">{app.fullname}</span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm text-slate-300">{app.email}</div>
                          {app.phone && <div className="text-xs text-slate-500">{app.phone}</div>}
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{app.yearsOfExperience} yrs</span>
                        </td>
                        <td className="py-3 px-6">
                          {app.resume ? (
                            <a
                              href={getFileUrl(app.resume.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors"
                            >
                              <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View
                            </a>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-6">
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
                              onClick={() => handleCalculateATS(app._id)}
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
                        <td className="py-3 px-6">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className={`text-xs py-1 px-2 rounded-full border-0 cursor-pointer capitalize font-medium ${
                              app.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              app.status === 'reviewed' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                              app.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6">
                          <button
                            onClick={() => setExpandedRow(expandedRow === app._id ? null : app._id)}
                            className="btn-ghost text-xs py-1 px-2"
                          >
                            {expandedRow === app._id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {expandedRow === app._id && (
                        <tr className="bg-slate-800/30">
                          <td colSpan="9" className="py-4 px-6">
                            <div className="space-y-4">
                              {app.coverLetter && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-100 mb-2">Cover Letter</h4>
                                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">{app.coverLetter}</p>
                                </div>
                              )}
                              {app.atsScore && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-100 mb-2">ATS Analysis</h4>
                                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30 space-y-3">
                                    <p className="text-sm text-slate-300">{app.atsScore.analysis}</p>
                                    <div className="grid md:grid-cols-2 gap-3">
                                      {app.atsScore.matchedSkills?.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-emerald-400 mb-1">✓ Matched Skills</p>
                                          <div className="flex flex-wrap gap-1">
                                            {app.atsScore.matchedSkills.map((skill, idx) => (
                                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{skill}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {app.atsScore.missingSkills?.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-red-400 mb-1">✗ Missing Skills</p>
                                          <div className="flex flex-wrap gap-1">
                                            {app.atsScore.missingSkills.map((skill, idx) => (
                                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">{skill}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
