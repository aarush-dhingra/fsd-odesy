import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SplineScene } from './ui/splite';
import { Card } from './ui/card';
import { Spotlight } from './ui/spotlight';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page min-h-screen flex bg-black">
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
                Welcome Back!
              </h2>
              <p className="text-neutral-300 max-w-lg text-xl">
                Continue your journey in predicting student success with AI-powered insights
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

        {/* Right Side - Role Selection */}
        <motion.div
          className="auth-form-section flex items-center justify-center bg-black"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="form-wrapper w-full max-w-md p-8 bg-neutral-900/95 backdrop-blur-lg border-white/20">
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
              <h1 className="form-title text-3xl font-bold text-white mb-2">Sign In</h1>
              <p className="form-subtitle text-neutral-400">Choose your role to continue</p>
            </motion.div>

            {/* Role Selection */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Student Login */}
              <motion.button
                onClick={() => navigate('/login/student')}
                className="w-full p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎓</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Student Login</h3>
                    <p className="text-sm text-neutral-400">Access your student dashboard</p>
                  </div>
                  <span className="ml-auto text-2xl">→</span>
                </div>
              </motion.button>

              {/* Faculty Login */}
              <motion.button
                onClick={() => navigate('/login/faculty')}
                className="w-full p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👨‍🏫</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Faculty Login</h3>
                    <p className="text-sm text-neutral-400">Access your faculty dashboard</p>
                  </div>
                  <span className="ml-auto text-2xl">→</span>
                </div>
              </motion.button>
              </motion.div>

              {/* Sign Up Link */}
              <p className="switch-auth text-center text-sm text-neutral-400 mt-6">
                Don't have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/signup'); }} 
                  className="switch-link text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  Sign up
                </a>
              </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
