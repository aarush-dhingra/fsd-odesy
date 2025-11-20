import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';

const FacultyDashboard = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalStudents: 0,
    criticalStudents: 0,
    atRiskStudents: 0,
  });

  useEffect(() => {
    // Fetch faculty stats from API
    const fetchStats = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${API_BASE_URL}/batches`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const batches = data.data || data || [];
          
          // Calculate stats from batches
          let totalStudents = 0;
          let criticalStudents = 0;
          let atRiskStudents = 0;
          
          batches.forEach((batch) => {
            totalStudents += batch.totalStudents || 0;
            criticalStudents += batch.criticalCount || 0;
            atRiskStudents += batch.atRiskCount || 0;
          });

          setStats({
            totalBatches: batches.length,
            totalStudents,
            criticalStudents,
            atRiskStudents,
          });
        } else {
          // Set to zero if API fails
          setStats({
            totalBatches: 0,
            totalStudents: 0,
            criticalStudents: 0,
            atRiskStudents: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set to zero if API fails
        setStats({
          totalBatches: 0,
          totalStudents: 0,
          criticalStudents: 0,
          atRiskStudents: 0,
        });
      }
    };

    fetchStats();
  }, [token, location.pathname]); // Refresh when navigating to this page

  const statCards = [
    {
      title: 'Total Batches',
      value: stats.totalBatches,
      icon: '📋',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Critical Students',
      value: stats.criticalStudents,
      icon: '⚠️',
      color: 'from-red-500 to-orange-500',
    },
    {
      title: 'At-Risk Students',
      value: stats.atRiskStudents,
      icon: '🔶',
      color: 'from-yellow-500 to-amber-500',
    },
  ];

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-neutral-400 text-lg">
            Monitor student performance and generate batch predictions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
                <Spotlight className="opacity-10" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-neutral-300 text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-slate-900/95 backdrop-blur-lg border-purple-500/30 relative overflow-hidden">
            <Spotlight className="opacity-10" />
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/faculty/batch-upload">
                  <motion.div
                    className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">📤</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Batch Upload</h3>
                        <p className="text-sm text-neutral-400">Upload student data</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
                
                <Link to="/faculty/prediction">
                  <motion.div
                    className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🔮</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">New Prediction</h3>
                        <p className="text-sm text-neutral-400">Single prediction</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                <Link to="/faculty/batches">
                  <motion.div
                    className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">📋</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">View Batches</h3>
                        <p className="text-sm text-neutral-400">Manage batches</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;

