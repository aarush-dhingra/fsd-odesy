import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { success, failure } from '../utils/responseFormatter.js';

const genToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res, next) => {
  try {
    const { name, fullName, email, password, role } = req.body;

    console.log('Registration attempt:', { name, fullName, email, role: role || 'student' });

    // Support both 'name' and 'fullName' for compatibility
    const userName = name || fullName;

    // Validate required fields
    if (!userName || !email || !password) {
      console.log('Registration failed: Missing required fields');
      return failure(res, 'Name, email, and password are required', 400);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`Registration failed: User already exists for email ${email}`);
      return failure(res, 'User already exists', 400);
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name: userName,
      email, 
      password: hash, 
      role: role || 'student'
    });
    
    console.log(`User registered successfully: ${user.email} (${user.role})`);
    
    // Remove password from user object before sending
    const userResponse = user.toObject();
    delete userResponse.password;
    
    const token = genToken(user._id, user.role);

    return success(res, { token, user: userResponse }, 'Registered');
  } catch (err) {
    console.error('Registration error:', err);
    next(err);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return failure(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`);
      return failure(res, 'Invalid credentials', 401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`Login attempt failed: Invalid password for email ${email}`);
      return failure(res, 'Invalid credentials', 401);
    }

    // If role is provided, validate it matches user's role
    if (role && user.role !== role) {
      console.log(`Login attempt failed: Role mismatch for email ${email}. Expected ${user.role}, got ${role}`);
      return failure(res, `Invalid role. Expected ${user.role}, got ${role}`, 401);
    }

    // Remove password from user object before sending
    const userResponse = user.toObject();
    delete userResponse.password;

    const token = genToken(user._id, user.role);

    console.log(`Login successful for user: ${user.email} (${user.role})`);
    return success(res, { token, user: userResponse }, 'Logged in');
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

export const me = async (req, res) => {
  return success(res, { user: req.user }, 'Me');
};
