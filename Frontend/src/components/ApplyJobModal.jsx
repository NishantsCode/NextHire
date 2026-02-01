import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyToJob } from '../api/applications';
import { useUser } from '../context/UserContext';
import { useToast } from './ui/Toast';
import FileUpload from './ui/FileUpload';

export default function ApplyJobModal({ isOpen, onClose, job, onSuccess, isAlreadyApplied = false }) {
  const { user } = useUser();
  const toast = useToast();
  const modalRef = useRef(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    coverLetter: '',
    yearsOfExperience: '',
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form with user data
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        coverLetter: '',
        yearsOfExperience: user.yearsOfExperience || '',
      });
      setResume(null);
      setErrors({});
    }
  }, [isOpen, user]);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Phone is now optional - no validation needed
    
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Experience is required';
    } else if (isNaN(formData.yearsOfExperience) || Number(formData.yearsOfExperience) < 0) {
      newErrors.yearsOfExperience = 'Please enter a valid number';
    }
    
    if (!resume) {
      newErrors.resume = 'Please upload your resume';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('jobId', job._id);
      data.append('fullname', formData.fullname.trim());
      data.append('email', formData.email.toLowerCase());
      data.append('phone', formData.phone);
      data.append('coverLetter', formData.coverLetter);
      data.append('yearsOfExperience', formData.yearsOfExperience);
      data.append('resume', resume);

      await applyToJob(data);
      toast.success('Application submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit application';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  // If already applied, show different content
  if (isAlreadyApplied) {
    return (
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="applied-modal-title"
      >
        <div 
          ref={modalRef}
          className="glass-strong rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div>
              <h2 id="applied-modal-title" className="text-lg font-bold text-slate-100">
                Already Applied
              </h2>
              <p className="text-sm text-slate-400">{job.title}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/30 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">You've Already Applied</h3>
              <p className="text-sm text-slate-300 mb-6">
                You have already submitted an application for this position. You can check the status of your application in your profile.
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/profile');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 shadow-lg hover:shadow-xl"
              >
                <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Check Application Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      <div 
        ref={modalRef}
        className="glass-strong rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div>
            <h2 id="apply-modal-title" className="text-lg font-bold text-slate-100">
              Apply for Position
            </h2>
            <p className="text-sm text-slate-400">{job.title}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/30 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {errors.submit && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400" role="alert">
                <svg className="icon-md flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{errors.submit}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="apply-fullname" className="block text-sm font-medium text-slate-200 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="apply-fullname"
                type="text"
                value={formData.fullname}
                onChange={(e) => handleChange('fullname', e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-800/50 border ${errors.fullname ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-150`}
                placeholder="John Doe"
                autoComplete="name"
              />
              {errors.fullname && <p className="text-xs text-red-400 mt-1">{errors.fullname}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label htmlFor="apply-email" className="block text-sm font-medium text-slate-200 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="apply-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-800/50 border ${errors.email ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-150`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="apply-phone" className="block text-sm font-medium text-slate-200 mb-1.5">
                  Phone <span className="text-slate-500 text-xs">(Optional)</span>
                </label>
                <input
                  id="apply-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-800/50 border ${errors.phone ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-150`}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="apply-experience" className="block text-sm font-medium text-slate-200 mb-1.5">
                Years of Experience <span className="text-red-400">*</span>
              </label>
              <input
                id="apply-experience"
                type="number"
                min="0"
                max="50"
                value={formData.yearsOfExperience}
                onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-800/50 border ${errors.yearsOfExperience ? 'border-red-500/50' : 'border-slate-700/50'} rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-150`}
                placeholder="e.g., 3"
              />
              {errors.yearsOfExperience && <p className="text-xs text-red-400 mt-1">{errors.yearsOfExperience}</p>}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                Resume <span className="text-red-400">*</span>
              </label>
              <FileUpload
                onFileSelect={(file) => {
                  setResume(file);
                  if (errors.resume) setErrors(prev => ({ ...prev, resume: '' }));
                }}
                value={resume}
                accept=".pdf,.doc,.docx"
                maxSize={5 * 1024 * 1024}
                label="Upload your resume"
                hint="PDF or Word, max 5MB"
                error={errors.resume}
              />
            </div>

            <div className="form-group">
              <label htmlFor="apply-cover" className="block text-sm font-medium text-slate-200 mb-1.5">
                Cover Letter <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="apply-cover"
                value={formData.coverLetter}
                onChange={(e) => handleChange('coverLetter', e.target.value)}
                rows="3"
                className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-150 resize-none"
                placeholder="Tell us why you're a great fit for this role..."
                maxLength={2000}
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {formData.coverLetter.length}/2000
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t border-slate-700/50">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 text-slate-200 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="spinner w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
