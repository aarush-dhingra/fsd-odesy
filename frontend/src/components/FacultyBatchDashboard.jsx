import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const FacultyBatchDashboard = () => {
  const { token } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, at-risk

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchBatches();
  }, [token]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || data || []);
      } else {
        // No batches or error - set empty array
        setBatches([]);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedBatch(data.data || data);
      } else {
        // Error loading batch - show error
        toast.error('Failed to load batch details');
        setSelectedBatch(null);
      }
    } catch (error) {
      console.error('Failed to fetch batch details:', error);
      toast.error('Failed to load batch details');
    }
  };

  const handleBatchClick = (batch) => {
    fetchBatchDetails(batch._id);
  };

  const handleBackToList = () => {
    setSelectedBatch(null);
  };

  const handleDeleteBatch = async (batchId, batchName, e) => {
    e.stopPropagation(); // Prevent triggering batch click
    
    if (!window.confirm(`Are you sure you want to delete "${batchName}"? This will also delete all associated predictions and cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Batch deleted successfully');
        // Refresh batches list
        fetchBatches();
        // If viewing the deleted batch, go back to list
        if (selectedBatch && selectedBatch.batch?._id === batchId) {
          setSelectedBatch(null);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Delete batch error:', error);
      toast.error('Failed to delete batch. Please try again.');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'safe':
        return '#10b981';
      case 'at-risk':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading && !selectedBatch) {
    return (
      <DashboardLayout role="faculty">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading batches...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="faculty">
      <div className="max-w-7xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {!selectedBatch ? (
            // Batch List View
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Batch Dashboard
                </h1>
                <p className="text-neutral-400 text-lg">
                  View and manage your batch predictions
                </p>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {['all', 'critical', 'at-risk'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      filter === filterOption
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Batch Cards */}
              {batches.length === 0 ? (
                <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No batches yet</h3>
                    <p className="text-neutral-400 text-center max-w-md mb-4">
                      Upload your first batch to get started with bulk predictions.
                    </p>
                    <Link to="/faculty/batch-upload">
                      <motion.div
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Upload Batch →
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {batches.map((batch, index) => (
                    <motion.div
                      key={batch._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                        onClick={() => handleBatchClick(batch)}
                      >
                        <Spotlight className="opacity-10" />
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white">{batch.name || `Batch ${index + 1}`}</CardTitle>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteBatch(batch._id, batch.name || `Batch ${index + 1}`, e)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                title="Delete batch"
                              >
                                🗑️
                              </button>
                              <span className="text-2xl">📋</span>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-400 mt-1">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                            <div className="text-3xl font-bold text-white mb-1">
                              {Math.round(batch.totalStudents || 0)}
                            </div>
                            <div className="text-sm text-neutral-400">Total Students</div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-green-500/20 rounded border border-green-500/30">
                              <div className="text-lg font-bold text-green-400">
                                {Math.round(batch.safeCount || 0)}
                              </div>
                              <div className="text-xs text-neutral-400">Safe</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                              <div className="text-lg font-bold text-yellow-400">
                                {Math.round(batch.atRiskCount || 0)}
                              </div>
                              <div className="text-xs text-neutral-400">At-Risk</div>
                            </div>
                            <div className="text-center p-2 bg-red-500/20 rounded border border-red-500/30">
                              <div className="text-lg font-bold text-red-400">
                                {Math.round(batch.criticalCount || 0)}
                              </div>
                              <div className="text-xs text-neutral-400">Critical</div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10">
                            <p className="text-xs text-neutral-400 text-center">
                              Click to view details →
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // Batch Detail View
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Back Button and Delete */}
              <div className="flex items-center justify-between">
                <motion.button
                  onClick={handleBackToList}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>←</span> Back to Batches
                </motion.button>
                {selectedBatch?.batch?._id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${selectedBatch.batch?.name || 'this batch'}"? This will also delete all associated predictions and cannot be undone.`)) {
                        handleDeleteBatch(selectedBatch.batch._id, selectedBatch.batch.name || 'this batch', { stopPropagation: () => {} });
                      }
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all"
                  >
                    🗑️ Delete Batch
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  {selectedBatch.name || 'Batch Details'}
                </h1>
                <p className="text-neutral-400">
                  {new Date(selectedBatch.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
                  <Spotlight className="opacity-10" />
                  <CardHeader>
                    <CardTitle className="text-white">Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Safe',
                              value: selectedBatch.students?.filter((s) => s.riskLevel === 'Safe').length || 0,
                            },
                            {
                              name: 'At-Risk',
                              value: selectedBatch.students?.filter((s) => s.riskLevel === 'At-Risk').length || 0,
                            },
                            {
                              name: 'Critical',
                              value: selectedBatch.students?.filter((s) => s.riskLevel === 'Critical').length || 0,
                            },
                          ].filter((item) => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Safe', value: selectedBatch.students?.filter((s) => s.riskLevel === 'Safe').length || 0 },
                            { name: 'At-Risk', value: selectedBatch.students?.filter((s) => s.riskLevel === 'At-Risk').length || 0 },
                            { name: 'Critical', value: selectedBatch.students?.filter((s) => s.riskLevel === 'Critical').length || 0 },
                          ]
                            .filter((item) => item.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
                  <Spotlight className="opacity-10" />
                  <CardHeader>
                    <CardTitle className="text-white">Risk Level Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            name: 'Safe',
                            count: selectedBatch.students?.filter((s) => s.riskLevel === 'Safe').length || 0,
                          },
                          {
                            name: 'At-Risk',
                            count: selectedBatch.students?.filter((s) => s.riskLevel === 'At-Risk').length || 0,
                          },
                          {
                            name: 'Critical',
                            count: selectedBatch.students?.filter((s) => s.riskLevel === 'Critical').length || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Students Table */}
              <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
                <Spotlight className="opacity-10" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Students</CardTitle>
                    <div className="flex gap-2">
                      {['all', 'critical', 'at-risk'].map((filterOption) => (
                        <button
                          key={filterOption}
                          onClick={() => setFilter(filterOption)}
                          className={`px-3 py-1 rounded text-sm transition-all ${
                            filter === filterOption
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                          }`}
                        >
                          {filterOption === 'all' ? 'All' : filterOption === 'critical' ? 'Critical' : 'At-Risk'}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Roll Number</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Attendance</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Study Hours</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Assignments</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Prediction</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Risk Score</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBatch.students
                          ?.filter((student) => {
                            if (filter === 'all') return true;
                            return student.riskLevel?.toLowerCase() === filter.replace('-', '');
                          })
                          .map((student, index) => (
                            <motion.tr
                              key={student._id || index}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.02 }}
                            >
                              <td className="py-3 px-4 text-sm font-medium text-white">
                                {student.name || `Student ${index + 1}`}
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-400">
                                {student.rollNumber || '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-300">
                                {Math.round(student.attendance || 0)}%
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-300">
                                {Math.round(student.studyHours || 0)} hrs
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-300">
                                {Math.round(student.assignmentsCompleted || 0)}
                              </td>
                              <td className="py-3 px-4 text-sm font-semibold text-white">
                                {student.prediction || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-300">
                                {Math.round(student.riskScore || 0)}/100
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getRiskColor(student.riskLevel)}20`,
                                    border: `1px solid ${getRiskColor(student.riskLevel)}50`,
                                    color: getRiskColor(student.riskLevel),
                                  }}
                                >
                                  {student.riskLevel || 'N/A'}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default FacultyBatchDashboard;

