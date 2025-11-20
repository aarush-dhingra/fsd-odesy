import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  const stats = [
    { number: "95", suffix: "%", label: "Accuracy Rate" },
    { number: "10000", suffix: "+", label: "Predictions Made" },
    { number: "500", suffix: "+", label: "Students Helped" },
    { number: "24", suffix: "/7", label: "Available" }
  ];

  const features = [
    {
      icon: "📊",
      title: "Performance Analysis",
      description: "Advanced AI-powered analysis of student performance metrics"
    },
    {
      icon: "🎯",
      title: "Accurate Predictions",
      description: "Get precise predictions based on attendance, marks, and activities"
    },
    {
      icon: "📈",
      title: "Progress Tracking",
      description: "Monitor and track student progress over time"
    },
    {
      icon: "🔔",
      title: "Real-time Alerts",
      description: "Receive instant notifications for at-risk students"
    }
  ];

  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Navigation */}
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-icon">🎓</span>
          <span className="logo-text">Student Performance Predictor</span>
        </motion.div>

        <div className="nav-buttons">
          <motion.button
            className="nav-btn login-btn"
            whileHover={{ scale: 1.05, boxShadow: "0 5px 20px rgba(102, 126, 234, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredButton('login')}
            onHoverEnd={() => setHoveredButton(null)}
            onClick={() => navigate('/login')}
          >
            Login
          </motion.button>

          <motion.button
            className="nav-btn signup-btn"
            whileHover={{ scale: 1.05, boxShadow: "0 5px 20px rgba(118, 75, 162, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredButton('signup')}
            onHoverEnd={() => setHoveredButton(null)}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        className="hero-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-content">
          <motion.h1
            className="hero-title"
            variants={itemVariants}
          >
            Predict Student Success
            <motion.span
              className="title-highlight"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              {" "}with AI
            </motion.span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            variants={itemVariants}
          >
            Harness the power of machine learning to predict academic performance
            based on attendance, study hours, internal marks, and extracurricular activities.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={itemVariants}
          >
            <motion.button
              className="cta-btn primary"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(102, 126, 234, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
              <span className="btn-arrow">→</span>
            </motion.button>

            <motion.button
              className="cta-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>

          <motion.div
            className="hero-image"
            variants={itemVariants}
            animate={floatingAnimation}
          >
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <div className="mockup-content">
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="stats-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="stats-container">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
            >
              <motion.h3
                className="stat-number"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                {stat.number}
                <span className="stat-suffix">{stat.suffix}</span>
              </motion.h3>
              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="features-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Powerful Features
        </motion.h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{
                y: -15,
                boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div
                className="feature-icon"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="cta-section"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="cta-content"
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="cta-title">Ready to Transform Education?</h2>
          <p className="cta-text">
            Join thousands of educators using AI to improve student outcomes
          </p>
          <motion.button
            className="cta-btn-large"
            whileHover={{ scale: 1.05, boxShadow: "0 15px 50px rgba(102, 126, 234, 0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            Start Free Trial
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p>&copy; 2024 Student Performance Predictor. All rights reserved.</p>
      </motion.footer>
    </div>
  );
};

export default HomePage;
