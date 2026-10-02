import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resourceService } from '../../services/resourceService';
import { DEPARTMENTS, RESOURCE_TYPES, SEMESTERS } from '../../utils/constants';
import { formatBytes } from '../../utils/formatters';
import Toast from '../../components/common/Toast';

const UploadResourcePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    department: user?.department || DEPARTMENTS[0],
    semester: 1,
    resourceType: RESOURCE_TYPES[0],
    description: '',
    tags: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setErrorMessage('Only PDF documents (.pdf) are permitted.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage('File size exceeds the 25MB limit.');
        setSelectedFile(null);
        return;
      }
      setErrorMessage('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFile) {
      setErrorMessage('Please select a PDF document to upload.');
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.subject.trim() ||
      !formData.description.trim()
    ) {
      setErrorMessage('Please fill in all required title, subject, and description fields.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const form = new FormData();
      form.append('file', selectedFile);
      form.append('title', formData.title.trim());
      form.append('subject', formData.subject.trim());
      form.append('department', formData.department);
      form.append('semester', formData.semester);
      form.append('resourceType', formData.resourceType);
      form.append('description', formData.description.trim());
      form.append('tags', formData.tags);

      const res = await resourceService.uploadResource(form, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success) {
        setSuccessMessage(
          'Resource uploaded successfully! It is now pending administrative approval.'
        );
        // Reset form
        setFormData({
          title: '',
          subject: '',
          department: user?.department || DEPARTMENTS[0],
          semester: 1,
          resourceType: RESOURCE_TYPES[0],
          description: '',
          tags: '',
        });
        setSelectedFile(null);
        setUploadProgress(0);
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Failed to upload the study material. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Upload Academic Study Material
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Contribute verified lecture notes, previous question papers, assignments, or textbooks for fellow college students.
        </p>
      </div>

      <Toast
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />
      <Toast
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* PDF File Picker Zone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select PDF Document <span className="text-rose-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition bg-slate-50/50 hover:bg-slate-50 cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(selectedFile.size)} • PDF Ready
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click or drag and drop your PDF here
                </p>
                <p className="text-xs text-slate-500">
                  Maximum file size: 25MB • Format: PDF only
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Resource Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Unit 3 - Operating Systems Memory Management Notes"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Subject & Resource Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject Name / Course Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. CS6401 Operating Systems"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resource Type <span className="text-rose-500">*</span>
            </label>
            <select
              name="resourceType"
              value={formData.resourceType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Department & Semester Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Department <span className="text-rose-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Semester <span className="text-rose-500">*</span>
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Resource Description / Covered Topics <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Outline chapters covered, professor notes, key formulas, or exam focus points..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tags (Comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="paging, segmentation, virtual memory, anna university, midterms"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Progress Bar when uploading */}
        {isUploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Uploading PDF...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            Newly uploaded documents are saved with status <span className="font-bold font-mono">pending</span>. They will be visible across the public catalog after faculty/admin verification.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isUploading ? (
            <span>Uploading Study Material ({uploadProgress}%)...</span>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Submit Resource for Quality Approval</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadResourcePage;
