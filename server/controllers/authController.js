const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Client = require('../models/Client');

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are all required');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(400, 'An account with that email already exists');
  }

  // Public registration can only create regular users or dietitians —
  // never admins, to avoid privilege escalation via the API.
  const safeRole = role === 'dietitian' ? 'dietitian' : 'user';

  const user = await User.create({ name, email, password, role: safeRole });

  if (user.role === 'user') {
    await Client.create({ user: user._id, name: user.name });
  }

  const token = generateToken(user._id);
  res.status(201).json({ token, user: user.toSafeObject() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(400, 'Invalid email or password');
  }

  const token = generateToken(user._id);
  res.json({ token, user: user.toSafeObject() });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
