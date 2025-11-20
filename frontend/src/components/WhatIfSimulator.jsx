import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WhatIfSimulator = ({ role = 'student' }) => {
  const { token } = useAuth();
  const [inputs, setInputs] = useState({
    attendance: 75,
    studyHours: 20,
    assignmentsCompleted: 8,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

  const calculateRiskLevel = (riskScore) => {
    if (riskScore <= 30) return { level: 'Safe', color: '#10b981', emoji: '✅' };
    if (riskScore <= 70) return { level: 'At-Risk', color: '#f59e0b', emoji: '⚠️' };
    return { level: 'Critical', color: '#ef4444', emoji: '🚨' };
  };

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch(`${ML_API_URL}/predict/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            features: {
              attendance: inputs.attendance,
              study_hours: inputs.studyHours,
              assignments_completed: inputs.assignmentsCompleted,
            },
          }),
        });
      } catch (networkError) {
        // Handle network errors (connection refused, etc.)
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('ERR_CONNECTION_REFUSED')) {
          console.error(`Cannot connect to ML API at ${ML_API_URL}. Make sure it's running.`);
          setPrediction(null);
          return;
        }
        throw networkError;
      }

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = response.statusText;
        }
        console.error('ML API Error:', errorText);
        setPrediction(null);
        return;
      }

      const data = await response.json();
      // Backend returns: predicted_label, risk_category, risk_score
      const predictionResult = data.predicted_label === 'at_risk' ? 'Fail' : 'Pass';
      // Convert 0-1 to 0-100, ensuring very small values (> 0) don't show as 0%
      const rawRiskPercent = (data.risk_score || 0) * 100;
      let riskScorePercent = Math.round(rawRiskPercent);
      // If value is > 0 but rounds to 0, show as 1% (minimum visible value)
      if (rawRiskPercent > 0 && riskScorePercent === 0) {
        riskScorePercent = 1;
      }
      
      // Map backend risk_category to frontend risk level
      let riskLevel;
      if (data.risk_category === 'high') {
        riskLevel = { level: 'Critical', color: '#ef4444', emoji: '🚨' };
      } else if (data.risk_category === 'medium') {
        riskLevel = { level: 'At-Risk', color: '#f59e0b', emoji: '⚠️' };
      } else {
        riskLevel = { level: 'Safe', color: '#10b981', emoji: '✅' };
      }

      const predictionData = {
        result: predictionResult,
        riskScore: riskScorePercent,
        riskLevel: riskLevel,
        timestamp: Date.now(),
      };

      setPrediction(predictionData);
      
      // Add to history for chart
      setHistory((prev) => {
        const newHistory = [...prev, { ...predictionData, index: prev.length }].slice(-10);
        return newHistory;
      });
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  }, [inputs, ML_API_URL]);

  // Debounced prediction fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrediction();
    }, 500);

    return () => clearTimeout(timer);
  }, [inputs, fetchPrediction]);

  const handleSliderChange = (name, value) => {
    setInputs({
      ...inputs,
      [name]: parseFloat(value),
    });
  };

  const accentColor = role === 'student' ? 'blue' : 'purple';
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const chartData = history.map((item, index) => ({
    name: `Trial ${index + 1}`,
    risk: item.riskScore,
  }));

  const pieData = prediction
    ? [
        { name: 'Safe', value: prediction.riskScore <= 30 ? 100 : 0 },
        { name: 'At-Risk', value: prediction.riskScore > 30 && prediction.riskScore <= 70 ? 100 : 0 },
        { name: 'Critical', value: prediction.riskScore > 70 ? 100 : 0 },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            What-If Performance Simulator
          </h1>
          <p className="text-neutral-400 text-lg">
            Adjust the sliders to see how different inputs affect your performance prediction
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders Panel */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`bg-slate-900/95 backdrop-blur-lg border-${accentColor}-500/30 relative overflow-hidden`}>
              <Spotlight className="opacity-10" />
              <CardHeader>
                <CardTitle className="text-white">Interactive Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Attendance Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-neutral-300">
                      Attendance: {inputs.attendance}%
                    </label>
                    <span className="text-xs text-neutral-400">0 - 100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={inputs.attendance}
                    onChange={(e) => handleSliderChange('attendance', e.target.value)}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Study Hours Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-neutral-300">
                      Study Hours per Week: {inputs.studyHours}
                    </label>
                    <span className="text-xs text-neutral-400">0 - 40 hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={inputs.studyHours}
                    onChange={(e) => handleSliderChange('studyHours', e.target.value)}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                  </div>
                </div>

                {/* Assignments Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-neutral-300">
                      Assignments Completed: {inputs.assignmentsCompleted}
                    </label>
                    <span className="text-xs text-neutral-400">0 - 15</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={inputs.assignmentsCompleted}
                    onChange={(e) => handleSliderChange('assignmentsCompleted', e.target.value)}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>0</span>
                    <span>7</span>
                    <span>15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Chart */}
            {history.length > 0 && (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                <Spotlight className="opacity-10" />
                <CardHeader>
                  <CardTitle className="text-white">Risk Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
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
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Live Result Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {loading ? (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-neutral-400">Calculating...</p>
                  </div>
                </CardContent>
              </Card>
            ) : prediction ? (
              <>
                <Card
                  className={`bg-slate-900/95 backdrop-blur-lg border-${prediction.riskLevel.color === '#10b981' ? 'green' : prediction.riskLevel.color === '#f59e0b' ? 'yellow' : 'red'}-500/30 relative overflow-hidden`}
                >
                  <Spotlight className="opacity-10" />
                  <CardHeader>
                    <CardTitle className="text-white">Live Prediction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">{prediction.riskLevel.emoji}</div>
                      <div
                        className="text-2xl font-bold mb-1"
                        style={{ color: prediction.riskLevel.color }}
                      >
                        {prediction.result}
                      </div>
                      <div className="text-sm text-neutral-400">Prediction</div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Risk Level</span>
                        <span className="text-sm font-semibold" style={{ color: prediction.riskLevel.color }}>
                          {prediction.riskLevel.level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Risk Score</span>
                        <span className="text-sm font-semibold text-white">
                          {prediction.riskScore}/100
                        </span>
                      </div>
                      <div className="mt-4 w-full bg-white/10 rounded-full h-3">
                        <motion.div
                          className="h-3 rounded-full"
                          style={{
                            backgroundColor: prediction.riskLevel.color,
                            width: `${prediction.riskScore}%`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.riskScore}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gauge Chart */}
                {pieData.length > 0 && (
                  <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                    <Spotlight className="opacity-10" />
                    <CardHeader>
                      <CardTitle className="text-white">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
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
                )}
              </>
            ) : (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-neutral-400">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Adjust sliders to see predictions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatIfSimulator;

