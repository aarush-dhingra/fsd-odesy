import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';

const StudentDashboard = () => {
  const { user, token } = useAuth();

  const [stats, setStats] = useState({
    totalPredictions: 0,
    averageRisk: 0,
    lastPrediction: null,
  });

  useEffect(() => {
    // Fetch student stats from API
    const fetchStats = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${API_BASE_URL}/predictions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const predictions = data.data || data || [];
          
          if (predictions.length > 0) {
            const totalPredictions = predictions.length;
            const averageRisk = Math.round(
              predictions.reduce((sum, p) => sum + (p.riskScore || 0), 0) / totalPredictions
            );
            const lastPrediction = predictions[0]?.createdAt 
              ? new Date(predictions[0].createdAt).toLocaleDateString()
              : null;

            setStats({
              totalPredictions,
              averageRisk,
              lastPrediction,
            });
          } else {
            // No predictions yet
            setStats({
              totalPredictions: 0,
              averageRisk: 0,
              lastPrediction: null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set to zero if API fails
        setStats({
          totalPredictions: 0,
          averageRisk: 0,
          lastPrediction: null,
        });
      }
    };

    fetchStats();
  }, [token]);

  const statCards = [
    {
      title: 'Total Predictions',
      value: stats.totalPredictions,
      icon: '🔮',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Average Risk Score',
      value: `${stats.averageRisk}%`,
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Last Prediction',
      value: stats.lastPrediction || 'Never',
      icon: '📅',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-neutral-400 text-lg">
            Track your academic performance and get AI-powered predictions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/95 backdrop-blur-lg border-blue-500/30 relative overflow-hidden">
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
          <Card className="bg-slate-900/95 backdrop-blur-lg border-blue-500/30 relative overflow-hidden">
            <Spotlight className="opacity-10" />
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/student/prediction">
                  <motion.div
                    className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🔮</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">New Prediction</h3>
                        <p className="text-sm text-neutral-400">Get a performance prediction</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
                
                <Link to="/student/simulator">
                  <motion.div
                    className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🎯</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">What-If Simulator</h3>
                        <p className="text-sm text-neutral-400">Explore different scenarios</p>
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

export default StudentDashboard;

