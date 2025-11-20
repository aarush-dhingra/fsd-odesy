import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children, role = 'student' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/student/prediction', label: 'New Prediction', icon: '🔮' },
    { path: '/student/simulator', label: 'What-If Simulator', icon: '🎯' },
    { path: '/student/history', label: 'Previous Predictions', icon: '📜' },
  ];

  const facultyNavItems = [
    { path: '/faculty/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/faculty/prediction', label: 'New Prediction', icon: '🔮' },
    { path: '/faculty/simulator', label: 'What-If Simulator', icon: '🎯' },
    { path: '/faculty/history', label: 'Previous Predictions', icon: '📜' },
    { path: '/faculty/batch-upload', label: 'Batch Upload', icon: '📤' },
    { path: '/faculty/batches', label: 'Batch Dashboard', icon: '📋' },
  ];

  const navItems = role === 'student' ? studentNavItems : facultyNavItems;
  const accentColor = role === 'student' ? 'blue' : 'purple';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b ${accentColor === 'blue' ? 'border-blue-500/30' : 'border-purple-500/30'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-2xl">☰</span>
            </button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              {role === 'student' ? '🎓 Student Portal' : '👨‍🏫 Faculty Portal'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-400">Welcome,</span>
              <span className="font-semibold">{user?.name}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r ${accentColor === 'blue' ? 'from-blue-600 to-cyan-600' : 'from-purple-600 to-pink-600'} hover:opacity-90 transition-opacity text-sm font-medium`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <motion.aside
          className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed left-0 top-16 bottom-0 bg-slate-900/95 backdrop-blur-lg border-r ${accentColor === 'blue' ? 'border-blue-500/30' : 'border-purple-500/30'} overflow-hidden transition-all duration-300`}
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? `${accentColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

