import { useState } from 'react';
import { updateProfile } from '../api/auth';
import FileUpload from './ui/FileUpload';

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    phone: user?.phone || '',
    organizationname: user?.organizationname || '',
  });
  const [resumeFile, setResumeFile] = useState(null);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('fullname', formData.fullname);
      data.append('phone', formData.phone || '');
      
      if (user.role === 'hr') {
        data.append('organizationname', formData.organizationname);
      }
      
      if (resumeFile) {
        data.append('resume', resumeFile);
      }

      const response = await updateProfile(data);
      
      if (response.success) {
        onProfileUpdate(response.user);
        setIsEditing(false);
        setResumeFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullname: user.fullname,
      phone: user.phone || '',
      organizationname: user.organizationname || '',
    });
    setResumeFile(null);
    setError('');
    setIsEditing(false);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={handleClose}>
      <div className="glass-strong max-w-lg w-full rounded-2xl shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {isEditing ? 'Edit Profile' : 'Profile'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                <p className="font-medium text-white">{user.fullname}</p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <p className="font-medium text-white">{user.email}</p>
              </div>

              {user.role === 'hr' && (
                <>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-xs text-slate-400 mb-1 block">Organization</label>
                    <p className="font-medium text-white">{user.organizationname}</p>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-xs text-slate-400 mb-1 block">Organization ID</label>
                    <p className="font-medium text-white">{user.organizationid}</p>
                  </div>
                </>
              )}

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                <p className="font-medium text-white">{user.phone || 'Not provided'}</p>
              </div>

              {user.role === 'user' && user.resume && (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <label className="text-xs text-slate-400 mb-1 block">Resume</label>
                  <p className="font-medium text-emerald-400">{user.resume.originalName}</p>
                </div>
              )}

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <label className="text-xs text-slate-400 mb-1 block">Role</label>
                <p className="font-medium text-white capitalize">{user.role === 'hr' ? 'Employer' : 'Job Seeker'}</p>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-800/30 border border-slate-700/30 rounded-lg text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {user.role === 'hr' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Organization Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="organizationname"
                      value={formData.organizationname}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Organization ID</label>
                    <input
                      type="text"
                      value={user.organizationid}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-800/30 border border-slate-700/30 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Organization ID cannot be changed</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {user.role === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Update Resume {user.resume && <span className="text-slate-500 text-xs">(Optional)</span>}
                  </label>
                  <FileUpload
                    file={resumeFile}
                    onFileChange={setResumeFile}
                    accept=".pdf,.doc,.docx"
                    label={user.resume ? `Current: ${user.resume.originalName}` : 'No resume uploaded'}
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                Edit Profile
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 border border-slate-600/50"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
