import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const FacultyBatchUpload = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          droppedFile.type === 'application/vnd.ms-excel' ||
          droppedFile.name.endsWith('.xlsx') ||
          droppedFile.name.endsWith('.xls')) {
        // Create a new File object to ensure stable reference
        const fileCopy = new File([droppedFile], droppedFile.name, {
          type: droppedFile.type,
          lastModified: droppedFile.lastModified,
        });
        setFile(fileCopy);
      } else {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        // Create a new File object to ensure stable reference
        const fileCopy = new File([selectedFile], selectedFile.name, {
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
        });
        setFile(fileCopy);
        // Reset the input so the same file can be selected again if needed
        e.target.value = '';
      } else {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Create a fresh file reference to avoid ERR_UPLOAD_FILE_CHANGED
      const fileToUpload = file;
      
      // Validate file still exists and is valid
      if (!fileToUpload || !fileToUpload.name) {
        toast.error('File is no longer available. Please select the file again.');
        setUploading(false);
        setFile(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('name', batchName.trim());

      // Use XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploadResult(data.data || data);
            toast.success('Batch uploaded successfully!');
            setFile(null);
            setBatchName('');
            setUploadProgress(100);
            
            // Navigate to batch dashboard after a short delay to show success
            setTimeout(() => {
              navigate('/faculty/batches');
            }, 2000);
          } catch (e) {
            console.error('Failed to parse response:', e);
            toast.error('Upload completed but failed to parse response');
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.statusText || errorMessage;
          }
          console.error('Upload error:', errorMessage, xhr.status);
          toast.error(errorMessage);
        }
        setUploading(false);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        toast.error('Upload failed. Please check your connection and try again.');
        setUploading(false);
        setUploadProgress(0);
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        toast.error('Upload was cancelled');
        setUploading(false);
        setUploadProgress(0);
      });

      // Start upload
      xhr.open('POST', `${API_BASE_URL}/batches/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please check if the backend is running.');
      } else if (error.message.includes('ERR_UPLOAD_FILE_CHANGED')) {
        toast.error('File was modified during upload. Please select the file again and try uploading.');
        setFile(null);
      } else {
        toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
      }
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getRiskStats = (result) => {
    if (!result) return null;
    return {
      safe: result.safeCount || result.safe || 0,
      atRisk: result.atRiskCount || result.atRisk || 0,
      critical: result.criticalCount || result.critical || 0,
      total: result.totalStudents || result.total || 0,
    };
  };

  const stats = getRiskStats(uploadResult);

  return (
    <DashboardLayout role="faculty">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Batch File Upload
          </h1>
          <p className="text-neutral-400 text-lg">
            Upload an Excel file containing student data for bulk predictions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
              <Spotlight className="opacity-10" />
              <CardHeader>
                <CardTitle className="text-white">Upload Excel File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Batch Name Input */}
                <div>
                  <label htmlFor="batchName" className="block text-sm font-medium text-neutral-300 mb-2">
                    Batch Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="batchName"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., CS 2024 Batch A"
                    required
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    Give your batch a descriptive name for easy identification
                  </p>
                </div>

                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/20 hover:border-purple-500/50'
                  }`}
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="text-5xl">📄</div>
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-neutral-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-5xl">📤</div>
                      <div>
                        <p className="text-white font-medium mb-1">
                          Drag and drop your Excel file here
                        </p>
                        <p className="text-sm text-neutral-400">or</p>
                        <label className="inline-block mt-2">
                          <span className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                            Browse Files
                          </span>
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-neutral-500 mt-4">
                        Supported formats: .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Uploading...</span>
                      <span className="text-white">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <motion.button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!uploading && file ? { scale: 1.02 } : {}}
                  whileTap={!uploading && file ? { scale: 0.98 } : {}}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      Upload & Process
                      <span>→</span>
                    </>
                  )}
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {stats ? (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
                <Spotlight className="opacity-10" />
                <CardHeader>
                  <CardTitle className="text-white">Batch Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                    <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
                    <div className="text-sm text-neutral-400">Total Students Processed</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <span className="text-neutral-300">Safe</span>
                      </div>
                      <span className="text-xl font-bold text-green-400">{stats.safe}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <span className="text-neutral-300">At-Risk</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-400">{stats.atRisk}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <span className="text-neutral-300">Critical</span>
                      </div>
                      <span className="text-xl font-bold text-red-400">{stats.critical}</span>
                    </div>
                  </div>

                  <Link to="/faculty/batches">
                    <motion.div
                      className="block w-full py-3 px-6 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-center text-purple-400 transition-all cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View Batch Details →
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center text-neutral-400">
                    <div className="text-5xl mb-4">📊</div>
                    <p>Upload a file to see batch summary</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* File Format Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">File Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-neutral-300">
                <p>Your Excel file should contain the following columns:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><code className="bg-white/10 px-2 py-1 rounded">name</code> or <code className="bg-white/10 px-2 py-1 rounded">Name</code> or <code className="bg-white/10 px-2 py-1 rounded">Student Name</code> - Student's name (Required)</li>
                  <li><code className="bg-white/10 px-2 py-1 rounded">roll_number</code> or <code className="bg-white/10 px-2 py-1 rounded">Roll Number</code> - Optional, student roll number</li>
                  <li><code className="bg-white/10 px-2 py-1 rounded">attendance</code> or <code className="bg-white/10 px-2 py-1 rounded">Attendance</code> - Percentage (0-100) (Required)</li>
                  <li><code className="bg-white/10 px-2 py-1 rounded">study_hours</code> or <code className="bg-white/10 px-2 py-1 rounded">Study Hours</code> - Hours per week (Required)</li>
                  <li><code className="bg-white/10 px-2 py-1 rounded">assignments_completed</code> or <code className="bg-white/10 px-2 py-1 rounded">Assignments</code> - Number of assignments (Required)</li>
                  <li><code className="bg-white/10 px-2 py-1 rounded">internal_marks</code> or <code className="bg-white/10 px-2 py-1 rounded">Internal Marks</code> - Optional, marks (0-100)</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 font-medium mb-1">💡 Tip:</p>
                  <p className="text-xs text-neutral-400">
                    Column names are case-insensitive and can have spaces. The system will automatically detect common variations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyBatchUpload;

