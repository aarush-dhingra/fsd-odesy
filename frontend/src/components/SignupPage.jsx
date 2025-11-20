import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplineScene } from './ui/splite';
import { Card } from './ui/card';
import { Spotlight } from './ui/spotlight';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await register(
      formData.fullName,
      formData.email,
      formData.password,
      formData.role
    );
    
    if (!result.success) {
      setErrors({ submit: result.error || 'Registration failed' });
    }
  };

  return (
    <div className="signup-page min-h-screen flex bg-black">
      <div className="auth-container w-full grid md:grid-cols-2">
        {/* Left Side - Fullscreen Spline 3D Robot Scene */}
        <motion.div
          className="auth-visual hidden md:flex items-center justify-center bg-black relative overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          <div className="absolute inset-0 flex flex-col justify-center p-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-4">
                Join Us Today!
              </h2>
              <p className="text-neutral-300 max-w-lg text-xl">
                Start your journey in transforming education with AI-powered student performance predictions
              </p>
            </motion.div>

            {/* Fullscreen Spline Robot */}
            <div className="flex-1 w-full h-full min-h-[500px]">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          className="auth-form-section flex items-center justify-center bg-black"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="form-wrapper w-full max-w-md p-8 bg-slate-900/95 backdrop-blur-lg border-purple-500/30">
            <Spotlight className="opacity-20" />
            
            {/* Back Button */}
            <motion.button
              className="back-button mb-6 text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="back-arrow">←</span> Back to Home
            </motion.button>

            {/* Form Header */}
            <motion.div
              className="form-header mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="form-title text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="form-subtitle text-neutral-400">Fill in your details to get started</p>
            </motion.div>

            {/* Signup Form */}
            <motion.form
              className="auth-form space-y-6"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Error Message */}
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                >
                  {errors.submit}
                </motion.div>
              )}

              {/* Full Name Input */}
              <motion.div
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="fullName" className="form-label block text-sm font-medium text-neutral-300 mb-2">
                  Full Name
                </label>
                <div className="input-wrapper relative">
                  <span className="input-icon absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">👤</span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`form-input w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.fullName ? 'border-red-500/50' : 'border-white/10'} rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
                )}
              </motion.div>

              {/* Email Input */}
              <motion.div
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="email" className="form-label block text-sm font-medium text-neutral-300 mb-2">
                  Email Address
                </label>
                <div className="input-wrapper relative">
                  <span className="input-icon absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">📧</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </motion.div>

              {/* Password Input */}
              <motion.div
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="password" className="form-label block text-sm font-medium text-neutral-300 mb-2">
                  Password
                </label>
                <div className="input-wrapper relative">
                  <span className="input-icon absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className={`form-input w-full pl-10 pr-12 py-3 bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors z-10 flex items-center justify-center w-6 h-6"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </motion.div>

              {/* Confirm Password Input */}
              <motion.div
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="confirmPassword" className="form-label block text-sm font-medium text-neutral-300 mb-2">
                  Confirm Password
                </label>
                <div className="input-wrapper relative">
                  <span className="input-icon absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">🔒</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-input w-full pl-10 pr-12 py-3 bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors z-10 flex items-center justify-center w-6 h-6"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </motion.div>

              {/* Role Selection */}
              <motion.div
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="role" className="form-label block text-sm font-medium text-neutral-300 mb-2">
                  I am a
                </label>
                <div className="input-wrapper relative">
                  <span className="input-icon absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">👤</span>
                  <select
                    id="role"
                    name="role"
                    className="form-input w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="student" className="bg-slate-900">Student</option>
                    <option value="faculty" className="bg-slate-900">Faculty</option>
                  </select>
                </div>
              </motion.div>

              {/* Terms & Conditions */}
              <div className="terms-wrapper">
                <label className="checkbox-label flex items-start gap-2 text-sm text-neutral-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="checkbox mt-1 w-4 h-4 rounded border-white/20 bg-white/5" 
                    required 
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="terms-link text-purple-400 hover:text-purple-300 transition-colors">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="#" className="terms-link text-purple-400 hover:text-purple-300 transition-colors">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="submit-btn w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 40px rgba(139, 92, 246, 0.5)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="divider relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="divider-text px-4 bg-transparent text-neutral-400">or sign up with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="social-login grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  className="social-btn flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Google
                </motion.button>
                <motion.button
                  type="button"
                  className="social-btn flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/github.svg" alt="GitHub" className="w-5 h-5" />
                  GitHub
                </motion.button>
              </div>

              {/* Login Link */}
              <p className="switch-auth text-center text-sm text-neutral-400">
                Already have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/login'); }} 
                  className="switch-link text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  Sign in
                </a>
              </p>
            </motion.form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
