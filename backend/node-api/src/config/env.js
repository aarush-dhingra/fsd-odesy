export const loadEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'ML_API_BASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn('Missing env vars:', missing.join(', '));
  }
};
