import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Lenis from 'lenis'
import Loader from './components/Loader'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import StudentLogin from './components/StudentLogin'
import FacultyLogin from './components/FacultyLogin'
import SignupPage from './components/SignupPage'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './components/StudentDashboard'
import FacultyDashboard from './components/FacultyDashboard'
import PredictionForm from './components/PredictionForm'
import WhatIfSimulator from './components/WhatIfSimulator'
import PreviousPredictions from './components/PreviousPredictions'
import FacultyBatchUpload from './components/FacultyBatchUpload'
import FacultyBatchDashboard from './components/FacultyBatchDashboard'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  const handleLoadingComplete = () => {
    setLoading(false)
  }

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Router>
      <AuthProvider>
      <div className="app">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        <AnimatePresence mode="wait">
          {loading ? (
            <Loader key="loader" onLoadingComplete={handleLoadingComplete} />
          ) : (
            <Routes>
                {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
                <Route path="/login/student" element={<StudentLogin />} />
                <Route path="/login/faculty" element={<FacultyLogin />} />
              <Route path="/signup" element={<SignupPage />} />

                {/* Student Protected Routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/prediction"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <PredictionForm role="student" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/simulator"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <WhatIfSimulator role="student" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/history"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <PreviousPredictions role="student" />
                    </ProtectedRoute>
                  }
                />

                {/* Faculty Protected Routes */}
                <Route
                  path="/faculty/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/prediction"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <PredictionForm role="faculty" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/simulator"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <WhatIfSimulator role="faculty" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/history"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <PreviousPredictions role="faculty" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/batch-upload"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyBatchUpload />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/batches"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyBatchDashboard />
                    </ProtectedRoute>
                  }
                />
            </Routes>
          )}
        </AnimatePresence>
      </div>
      </AuthProvider>
    </Router>
  )
}

export default App
