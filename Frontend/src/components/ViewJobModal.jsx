import { useState } from 'react';

export default function ViewJobModal({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-strong rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-100 flex-1">{job.title}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                  job.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                  job.status === 'closed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {job.status}
                </span>
              </div>
              {job.jobId && (
                <p className="text-sm text-indigo-400 font-mono">
                  Job ID: {job.jobId}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-0.5">
                Posted on {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors ml-2"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {job.structuredJD ? (
            <>
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {job.structuredJD.location && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Location</p>
                    <p className="font-medium text-sm text-slate-100">{job.structuredJD.location}</p>
                  </div>
                )}
                {job.structuredJD.employmentType && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Employment Type</p>
                    <p className="font-medium text-sm text-slate-100 capitalize">{job.structuredJD.employmentType}</p>
                  </div>
                )}
                {job.structuredJD.experience && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Experience</p>
                    <p className="font-medium text-sm text-slate-100">{job.structuredJD.experience}</p>
                  </div>
                )}
                {job.structuredJD.salary && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Salary/Stipend</p>
                    <p className="font-medium text-sm text-slate-100">{job.structuredJD.salary}</p>
                  </div>
                )}
              </div>

              {/* Eligibility (Education & Experience Requirements) */}
              {job.structuredJD.eligibility?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Eligibility (Education & Experience)</h3>
                  <ul className="space-y-2">
                    {job.structuredJD.eligibility.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Skills */}
              {job.structuredJD.requiredSkills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Required Skills</h3>
                  <p className="text-sm text-slate-300">
                    {job.structuredJD.requiredSkills.join(', ')}
                  </p>
                </div>
              )}

              {/* Preferred Skills (Good to Have) */}
              {job.structuredJD.preferredSkills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Good to Have</h3>
                  <p className="text-sm text-slate-300">
                    {job.structuredJD.preferredSkills.join(', ')}
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {job.structuredJD.rolesAndResponsibilities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Roles & Responsibilities</h3>
                  <ul className="space-y-2">
                    {job.structuredJD.rolesAndResponsibilities.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.structuredJD.benefits?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Benefits</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {job.structuredJD.benefits.map((item, idx) => (
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

              {/* Additional Info */}
              {job.structuredJD.additionalInfo && job.structuredJD.additionalInfo.trim() && (
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3 text-base">Additional Information</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{job.structuredJD.additionalInfo}</p>
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="font-semibold text-slate-100 mb-3 text-base">Job Description</h3>
              <p className="text-sm text-slate-300 whitespace-pre-line">{job.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
