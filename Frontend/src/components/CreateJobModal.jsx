import { useState } from 'react';
import { createJob } from '../api/jobs';

export default function CreateJobModal({ isOpen, onClose, onJobCreated }) {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [structuredData, setStructuredData] = useState({
    rolesAndResponsibilities: [''],
    eligibility: [''],
    requiredSkills: [''],
    preferredSkills: [''],
    experience: '',
    education: '',
    location: '',
    employmentType: '',
    salary: '',
    benefits: [''],
    additionalInfo: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [mode, setMode] = useState('file');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [extractedData, setExtractedData] = useState(null);

  const handleStructuredChange = (field, value) => {
    setStructuredData({ ...structuredData, [field]: value });
  };

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...structuredData[field]];
    newArray[index] = value;
    setStructuredData({ ...structuredData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setStructuredData({ ...structuredData, [field]: [...structuredData[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const newArray = structuredData[field].filter((_, i) => i !== index);
    setStructuredData({ ...structuredData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  // Helper function to pre-fill form with extracted data
  const prefillFormWithExtractedData = (extractedData) => {
    if (extractedData.structuredJD) {
      setStructuredData({
        rolesAndResponsibilities: extractedData.structuredJD.rolesAndResponsibilities || [''],
        eligibility: extractedData.structuredJD.eligibility || [''],
        requiredSkills: extractedData.structuredJD.requiredSkills || [''],
        preferredSkills: extractedData.structuredJD.preferredSkills || [''],
        experience: extractedData.structuredJD.experience || '',
        education: extractedData.structuredJD.education || '',
        location: extractedData.structuredJD.location || '',
        employmentType: extractedData.structuredJD.employmentType || '',
        salary: extractedData.structuredJD.salary || '',
        benefits: extractedData.structuredJD.benefits || [''],
        additionalInfo: extractedData.structuredJD.additionalInfo || ''
      });
    }
    setFormData({ title: extractedData.title, description: extractedData.description });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF, Word (.doc, .docx), and Text (.txt) files are allowed');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'file' && !file && !showCompletionForm) {
      setError('Please upload a JD file');
      return;
    }
    if (mode === 'manual' && !formData.title && !showCompletionForm) {
      setError('Please provide job title');
      return;
    }
    
    setLoading(true);
    setExtracting(mode === 'file' && !showCompletionForm);
    setError('');

    try {
      const data = new FormData();
      
      // If completing missing fields
      if (showCompletionForm && extractedData) {
        data.append('title', extractedData.title || formData.title);
        data.append('description', extractedData.description || '');
        
        // Merge extracted data with user-filled data
        const completedStructuredData = {
          ...extractedData.structuredJD,
          ...structuredData
        };
        
        data.append('structuredJD', JSON.stringify(completedStructuredData));
        
        // Re-attach file info if it exists
        if (extractedData.jdFile) {
          // File is already uploaded, backend will handle it
        }
      } else if (mode === 'manual') {
        data.append('title', formData.title);
        const cleanedStructuredData = {
          rolesAndResponsibilities: structuredData.rolesAndResponsibilities.filter(item => item.trim()),
          eligibility: structuredData.eligibility.filter(item => item.trim()),
          requiredSkills: structuredData.requiredSkills.filter(item => item.trim()),
          preferredSkills: structuredData.preferredSkills.filter(item => item.trim()),
          experience: structuredData.experience,
          education: structuredData.education,
          location: structuredData.location,
          employmentType: structuredData.employmentType,
          salary: structuredData.salary,
          benefits: structuredData.benefits.filter(item => item.trim()),
          additionalInfo: structuredData.additionalInfo
        };
        
        let description = '';
        if (cleanedStructuredData.experience) description += `Experience: ${cleanedStructuredData.experience}\n`;
        if (cleanedStructuredData.location) description += `Location: ${cleanedStructuredData.location}\n`;
        if (cleanedStructuredData.employmentType) description += `Type: ${cleanedStructuredData.employmentType}\n`;
        if (cleanedStructuredData.requiredSkills.length > 0) {
          description += '\nRequired Skills: ' + cleanedStructuredData.requiredSkills.join(', ');
        }
        
        data.append('description', description.trim() || 'No description provided');
        data.append('structuredJD', JSON.stringify(cleanedStructuredData));
      }
      
      if (file && !showCompletionForm) data.append('jdFile', file);

      const response = await createJob(data);
      
      // Check if completion is required
      if (response.requiresCompletion) {
        setShowCompletionForm(true);
        setMissingFields(response.missingFields);
        setExtractedData(response.extractedData);
        prefillFormWithExtractedData(response.extractedData);
        setError('');
        setLoading(false);
        setExtracting(false);
        return;
      }
      
      handleClose();
      onJobCreated();
    } catch (err) {
      if (err.response?.data?.requiresCompletion) {
        setShowCompletionForm(true);
        setMissingFields(err.response.data.missingFields);
        setExtractedData(err.response.data.extractedData);
        prefillFormWithExtractedData(err.response.data.extractedData);
        setError('');
      } else {
        setError(err.response?.data?.message || 'Failed to create job');
      }
    } finally {
      setLoading(false);
      setExtracting(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '' });
    setStructuredData({
      rolesAndResponsibilities: [''],
      eligibility: [''],
      requiredSkills: [''],
      preferredSkills: [''],
      experience: '',
      education: '',
      location: '',
      employmentType: '',
      salary: '',
      benefits: [''],
      additionalInfo: ''
    });
    setFile(null);
    setError('');
    setMode('file');
    setShowCompletionForm(false);
    setMissingFields([]);
    setExtractedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-bold text-content-primary">
            {showCompletionForm ? 'Complete Job Details' : 'Create New Job'}
          </h2>
          <button onClick={handleClose} className="text-content-muted hover:text-content-primary text-xl leading-none">
            ×
          </button>
        </div>

        <div className="modal-body">
          {showCompletionForm && (
            <div className="alert-warning mb-4">
              <svg className="icon-md" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Missing Required Fields</p>
                <p className="text-xs mt-1">Please fill in the following fields to complete your job posting: <strong>{missingFields.join(', ')}</strong></p>
              </div>
            </div>
          )}

          {!showCompletionForm && (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-1 mb-5 bg-surface-tertiary p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('file')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    mode === 'file' ? 'bg-surface-secondary shadow text-content-primary' : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Upload JD File
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    mode === 'manual' ? 'bg-surface-secondary shadow text-content-primary' : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Manual Entry
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="alert-error mb-4 animate-slide-down">
              <svg className="icon-md" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {extracting && (
            <div className="alert-info mb-4 animate-slide-down">
              <svg className="spinner w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Extracting job details using AI...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {showCompletionForm ? (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {/* Show extracted job title */}
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
                  <p className="text-sm text-brand-700">
                    <strong>Job Title:</strong> {extractedData?.title || formData.title}
                  </p>
                </div>

                {/* Location */}
                {missingFields.includes('Location') && (
                  <div className="form-group">
                    <label className="label">Location <span className="text-danger-500">*</span></label>
                    <input
                      type="text"
                      value={structuredData.location}
                      onChange={(e) => handleStructuredChange('location', e.target.value)}
                      className="input"
                      placeholder="e.g., Remote, New York, Bangalore"
                      required
                    />
                  </div>
                )}

                {/* Salary */}
                {missingFields.includes('Stipend/Salary Range') && (
                  <div className="form-group">
                    <label className="label">Stipend/Salary Range <span className="text-danger-500">*</span></label>
                    <input
                      type="text"
                      value={structuredData.salary}
                      onChange={(e) => handleStructuredChange('salary', e.target.value)}
                      className="input"
                      placeholder="e.g., $80k - $120k, ₹5L - ₹8L"
                      required
                    />
                  </div>
                )}

                {/* Experience */}
                {missingFields.includes('Experience Level') && (
                  <div className="form-group">
                    <label className="label">Experience Level <span className="text-danger-500">*</span></label>
                    <input
                      type="text"
                      value={structuredData.experience}
                      onChange={(e) => handleStructuredChange('experience', e.target.value)}
                      className="input"
                      placeholder="e.g., 3-5 years, Fresher, 0-2 years"
                      required
                    />
                  </div>
                )}

                {/* Required Skills */}
                {missingFields.includes('Required Skills') && (
                  <div className="form-group">
                    <label className="label">Required Skills <span className="text-danger-500">*</span></label>
                    {structuredData.requiredSkills.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('requiredSkills', index, e.target.value)}
                          className="input flex-1"
                          placeholder={`Skill ${index + 1}`}
                          required={index === 0}
                        />
                        {structuredData.requiredSkills.length > 1 && (
                          <button type="button" onClick={() => removeArrayField('requiredSkills', index)} className="btn-ghost text-danger-600 px-2">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayField('requiredSkills')} className="btn-ghost text-xs">+ Add Skill</button>
                  </div>
                )}

                {/* Preferred Skills */}
                {missingFields.includes('Preferred Skills') && (
                  <div className="form-group">
                    <label className="label">Preferred Skills <span className="text-danger-500">*</span></label>
                    {structuredData.preferredSkills.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('preferredSkills', index, e.target.value)}
                          className="input flex-1"
                          placeholder={`Skill ${index + 1}`}
                          required={index === 0}
                        />
                        {structuredData.preferredSkills.length > 1 && (
                          <button type="button" onClick={() => removeArrayField('preferredSkills', index)} className="btn-ghost text-danger-600 px-2">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayField('preferredSkills')} className="btn-ghost text-xs">+ Add Skill</button>
                  </div>
                )}

                {/* Responsibilities */}
                {missingFields.includes('Responsibilities') && (
                  <div className="form-group">
                    <label className="label">Responsibilities <span className="text-danger-500">*</span></label>
                    {structuredData.rolesAndResponsibilities.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('rolesAndResponsibilities', index, e.target.value)}
                          className="input flex-1"
                          placeholder={`Responsibility ${index + 1}`}
                          required={index === 0}
                        />
                        {structuredData.rolesAndResponsibilities.length > 1 && (
                          <button type="button" onClick={() => removeArrayField('rolesAndResponsibilities', index)} className="btn-ghost text-danger-600 px-2">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayField('rolesAndResponsibilities')} className="btn-ghost text-xs">+ Add Responsibility</button>
                  </div>
                )}

                {/* Eligibility */}
                {missingFields.includes('Eligibility') && (
                  <div className="form-group">
                    <label className="label">Eligibility <span className="text-danger-500">*</span></label>
                    {structuredData.eligibility.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayFieldChange('eligibility', index, e.target.value)}
                          className="input flex-1"
                          placeholder={`Eligibility ${index + 1}`}
                          required={index === 0}
                        />
                        {structuredData.eligibility.length > 1 && (
                          <button type="button" onClick={() => removeArrayField('eligibility', index)} className="btn-ghost text-danger-600 px-2">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayField('eligibility')} className="btn-ghost text-xs">+ Add Eligibility</button>
                  </div>
                )}
              </div>
            ) : mode === 'file' ? (
              <div className="space-y-4">
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
                  <p className="text-sm text-brand-700">
                    <strong>Smart Upload:</strong> Upload your JD file and AI will extract all details automatically.
                  </p>
                </div>

                <div className="form-group">
                  <label className="label">Job Description File <span className="text-danger-500">*</span></label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 file:cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                      <svg className="icon-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {file.name}
                    </p>
                  )}
                  <p className="input-hint">PDF, Word (.doc, .docx), or Text (.txt), max 5MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <div className="form-group">
                  <label className="label">Job Title <span className="text-danger-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Experience</label>
                    <input
                      type="text"
                      value={structuredData.experience}
                      onChange={(e) => handleStructuredChange('experience', e.target.value)}
                      className="input"
                      placeholder="e.g., 3-5 years"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={structuredData.location}
                      onChange={(e) => handleStructuredChange('location', e.target.value)}
                      className="input"
                      placeholder="e.g., Remote, NYC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Employment Type</label>
                    <select
                      value={structuredData.employmentType}
                      onChange={(e) => handleStructuredChange('employmentType', e.target.value)}
                      className="select"
                    >
                      <option value="">Select type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Salary Range</label>
                    <input
                      type="text"
                      value={structuredData.salary}
                      onChange={(e) => handleStructuredChange('salary', e.target.value)}
                      className="input"
                      placeholder="e.g., $80k - $120k"
                    />
                  </div>
                </div>

                {/* Required Skills */}
                <div className="form-group">
                  <label className="label">Required Skills</label>
                  {structuredData.requiredSkills.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayFieldChange('requiredSkills', index, e.target.value)}
                        className="input flex-1"
                        placeholder={`Skill ${index + 1}`}
                      />
                      {structuredData.requiredSkills.length > 1 && (
                        <button type="button" onClick={() => removeArrayField('requiredSkills', index)} className="btn-ghost text-danger-600 px-2">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayField('requiredSkills')} className="btn-ghost text-xs">+ Add Skill</button>
                </div>

                {/* Responsibilities */}
                <div className="form-group">
                  <label className="label">Responsibilities</label>
                  {structuredData.rolesAndResponsibilities.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayFieldChange('rolesAndResponsibilities', index, e.target.value)}
                        className="input flex-1"
                        placeholder={`Responsibility ${index + 1}`}
                      />
                      {structuredData.rolesAndResponsibilities.length > 1 && (
                        <button type="button" onClick={() => removeArrayField('rolesAndResponsibilities', index)} className="btn-ghost text-danger-600 px-2">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayField('rolesAndResponsibilities')} className="btn-ghost text-xs">+ Add Responsibility</button>
                </div>

                {/* Additional Info */}
                <div className="form-group">
                  <label className="label">Additional Information</label>
                  <textarea
                    value={structuredData.additionalInfo}
                    onChange={(e) => handleStructuredChange('additionalInfo', e.target.value)}
                    rows="2"
                    className="textarea"
                    placeholder="Any other details..."
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <>
                <svg className="spinner w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {extracting ? 'Extracting...' : 'Creating...'}
              </>
            ) : showCompletionForm ? 'Complete & Post Job' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
