import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Spotlight } from './ui/spotlight';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PredictionForm = ({ role = 'student' }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    attendance: '',
    studyHours: '',
    assignmentsCompleted: '',
    internalMarks: '',
    activities: 'low',
  });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

  const handleChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const calculateRiskLevel = (riskScore) => {
    if (riskScore <= 30) return { level: 'Safe', color: 'green', emoji: '✅' };
    if (riskScore <= 70) return { level: 'At-Risk', color: 'yellow', emoji: '⚠️' };
    return { level: 'Critical', color: 'red', emoji: '🚨' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);

    try {
      // Call ML API for prediction
      let mlResponse;
      try {
        mlResponse = await fetch(`${ML_API_URL}/predict/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            features: {
              attendance: parseFloat(formData.attendance),
              study_hours: parseFloat(formData.studyHours),
              assignments_completed: parseFloat(formData.assignmentsCompleted),
              internal_marks: formData.internalMarks ? parseFloat(formData.internalMarks) : null,
              activities: formData.activities || 'None',
            },
          }),
        });
      } catch (networkError) {
        // Handle network errors (connection refused, etc.)
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(`Cannot connect to ML API. Please make sure the ML API is running on ${ML_API_URL}`);
        }
        throw networkError;
      }

      if (!mlResponse.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await mlResponse.text();
        } catch (e) {
          // If we can't read the error, use status text
          errorText = mlResponse.statusText;
        }
        console.error('ML API Error:', errorText);
        throw new Error(`Prediction failed: ${mlResponse.status} ${errorText}`);
      }

      const mlData = await mlResponse.json();
      // Backend returns: predicted_label, risk_category, risk_score
      const predictionResult = mlData.predicted_label === 'at_risk' ? 'Fail' : 'Pass';
      // Convert 0-1 to 0-100, ensuring very small values (> 0) don't show as 0%
      const rawRiskPercent = (mlData.risk_score || 0) * 100;
      let riskScorePercent = Math.round(rawRiskPercent);
      // If value is > 0 but rounds to 0, show as 1% (minimum visible value)
      if (rawRiskPercent > 0 && riskScorePercent === 0) {
        riskScorePercent = 1;
      }
      
      // Calculate confidence level
      // Confidence = probability of the predicted class
      // If prediction is "Pass", confidence = 1 - risk_score
      // If prediction is "Fail", confidence = risk_score
      const riskScoreDecimal = mlData.risk_score || 0;
      const confidenceDecimal = predictionResult === 'Pass' 
        ? 1 - riskScoreDecimal 
        : riskScoreDecimal;
      const confidencePercent = Math.round(confidenceDecimal * 100);
      
      // Map backend risk_category to frontend risk level
      let riskLevel;
      if (mlData.risk_category === 'high') {
        riskLevel = { level: 'Critical', color: 'red', emoji: '🚨' };
      } else if (mlData.risk_category === 'medium') {
        riskLevel = { level: 'At-Risk', color: 'yellow', emoji: '⚠️' };
      } else {
        riskLevel = { level: 'Safe', color: 'green', emoji: '✅' };
      }

      const predictionData = {
        result: predictionResult,
        riskScore: riskScorePercent,
        riskLevel: riskLevel,
        confidence: confidencePercent,
        inputs: { ...formData },
        timestamp: new Date().toISOString(),
      };

      // Save prediction to backend
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/predictions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              attendance: parseFloat(formData.attendance),
              studyHours: parseFloat(formData.studyHours),
              assignmentsCompleted: parseFloat(formData.assignmentsCompleted),
              internalMarks: formData.internalMarks ? parseFloat(formData.internalMarks) : null,
              prediction: predictionResult,
              riskScore: predictionData.riskScore,
              riskLevel: predictionData.riskLevel.level,
            }),
          });
        } catch (err) {
          console.error('Failed to save prediction:', err);
        }
      }

      setPrediction(predictionData);
      toast.success('Prediction generated successfully!');
    } catch (error) {
      console.error('Prediction error:', error);
      const errorMessage = error.message || 'Failed to generate prediction. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const accentColor = role === 'student' ? 'blue' : 'purple';

  return (
    <DashboardLayout role={role}>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            Performance Prediction
          </h1>
          <p className="text-neutral-400 text-lg">
            Enter your academic data to get an AI-powered performance prediction
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`bg-slate-900/95 backdrop-blur-lg border-${accentColor}-500/30 relative overflow-hidden`}>
              <Spotlight className="opacity-10" />
              <CardHeader>
                <CardTitle className="text-white">Input Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Attendance */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Attendance (%)
                    </label>
                    <input
                      type="number"
                      name="attendance"
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., 85"
                      required
                    />
                  </div>

                  {/* Study Hours */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Study Hours per Week
                    </label>
                    <input
                      type="number"
                      name="studyHours"
                      min="0"
                      max="168"
                      value={formData.studyHours}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., 20"
                      required
                    />
                  </div>

                  {/* Assignments Completed */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Assignments Completed
                    </label>
                    <input
                      type="number"
                      name="assignmentsCompleted"
                      min="0"
                      value={formData.assignmentsCompleted}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., 8"
                      required
                    />
                  </div>

                  {/* Internal Marks (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Internal Marks (Optional)
                    </label>
                    <input
                      type="number"
                      name="internalMarks"
                      min="0"
                      max="100"
                      value={formData.internalMarks}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., 75"
                    />
                  </div>

                  {/* Activities */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Activities Level
                    </label>
                    <select
                      name="activities"
                      value={formData.activities}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="None" className="bg-slate-900">None</option>
                      <option value="low" className="bg-slate-900">Low</option>
                      <option value="medium" className="bg-slate-900">Medium</option>
                      <option value="high" className="bg-slate-900">High</option>
                    </select>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-6 bg-gradient-to-r ${accentColor === 'blue' ? 'from-blue-600 to-cyan-600' : 'from-purple-600 to-pink-600'} text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Generating Prediction...
                      </>
                    ) : (
                      <>
                        Generate Prediction
                        <span>→</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {prediction ? (
              <Card className={`bg-slate-900/95 backdrop-blur-lg border-${prediction.riskLevel.color}-500/30 relative overflow-hidden`}>
                <Spotlight className="opacity-10" />
                <CardHeader>
                  <CardTitle className="text-white">Prediction Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-2">{prediction.riskLevel.emoji}</div>
                    <div className={`text-2xl font-bold text-${prediction.riskLevel.color}-400 mb-1`}>
                      {prediction.result}
                    </div>
                    <div className="text-sm text-neutral-400">Predicted Performance</div>
                  </div>

                  {/* Confidence Level */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-neutral-300">Confidence Level</span>
                      <span className="text-lg font-bold text-white">
                        {prediction.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 mb-1">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.confidence}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Risk Level</span>
                      <span className={`text-sm font-semibold text-${prediction.riskLevel.color}-400`}>
                        {prediction.riskLevel.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Risk Score</span>
                      <span className="text-sm font-semibold text-white">
                        {prediction.riskScore}/100
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className={`bg-gradient-to-r ${
                          prediction.riskLevel.color === 'green'
                            ? 'from-green-500 to-emerald-500'
                            : prediction.riskLevel.color === 'yellow'
                            ? 'from-yellow-500 to-amber-500'
                            : 'from-red-500 to-orange-500'
                        } h-2 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.riskScore}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/95 backdrop-blur-lg border-white/10 relative overflow-hidden">
                <Spotlight className="opacity-10" />
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-neutral-400">
                    <div className="text-4xl mb-2">🔮</div>
                    <p>Fill the form to get a prediction</p>
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

export default PredictionForm;

