import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const PreviousPredictions = ({ role = 'student' }) => {
  const { token } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, safe, at-risk, critical

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPredictions();
  }, [token]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/predictions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.data || data || []);
      } else {
        // No predictions or error - set empty array
        setPredictions([]);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'safe':
        return 'text-green-400';
      case 'at-risk':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'safe':
        return 'bg-green-500/20 border-green-500/30';
      case 'at-risk':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'critical':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-neutral-500/20 border-neutral-500/30';
    }
  };

  const filteredPredictions = predictions.filter((pred) => {
    if (filter === 'all') return true;
    return pred.riskLevel?.toLowerCase() === filter.replace('-', '');
  });

  const chartData = predictions
    .slice()
    .reverse()
    .map((pred, index) => ({
      name: `Pred ${index + 1}`,
      risk: Math.round(pred.riskScore || 0),
      date: new Date(pred.createdAt || pred.timestamp).toLocaleDateString(),
    }));

  const accentColor = role === 'student' ? 'blue' : 'purple';

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading predictions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            Previous Predictions
          </h1>
          <p className="text-neutral-400 text-lg">
            View your prediction history and track performance trends
          </p>
        </motion.div>

        {/* Trend Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className={`bg-slate-900/95 backdrop-blur-lg border-${accentColor}-500/30 relative overflow-hidden`}>
              <Spotlight className="opacity-10" />
              <CardHeader>
                <CardTitle className="text-white">Risk Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorRisk)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-2"
        >
          {['all', 'safe', 'at-risk', 'critical'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === filterOption
                  ? `${accentColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('-', ' ')}
            </button>
          ))}
        </motion.div>

        {/* Predictions Table */}
        {filteredPredictions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-semibold text-white mb-2">No predictions yet</h3>
                <p className="text-neutral-400 text-center max-w-md">
                  Start making predictions to see your history here. Your prediction trends and insights will appear once you have some data.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className={`bg-slate-900/95 backdrop-blur-lg border-${accentColor}-500/30 relative overflow-hidden`}>
              <Spotlight className="opacity-10" />
              <CardHeader>
                <CardTitle className="text-white">Prediction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Attendance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Study Hours</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Assignments</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Prediction</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Risk Score</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.map((pred, index) => (
                        <motion.tr
                          key={pred._id || index}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="py-3 px-4 text-sm text-neutral-300">
                            {new Date(pred.createdAt || pred.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-300">
                            {Math.round(pred.attendance || 0)}%
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-300">
                            {Math.round(pred.studyHours || 0)} hrs
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-300">
                            {Math.round(pred.assignmentsCompleted || 0)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-white">
                            {pred.prediction || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-300">
                            {Math.round(pred.riskScore || 0)}/100
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRiskBgColor(pred.riskLevel)} ${getRiskColor(pred.riskLevel)}`}
                            >
                              {pred.riskLevel || 'N/A'}
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
      </div>
    </DashboardLayout>
  );
};

export default PreviousPredictions;

