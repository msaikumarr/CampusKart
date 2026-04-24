const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, SERVER_URL, isProduction } = require('../config/env');

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isCollegeEmail = (email) => {
  const allowedSuffixes = ['edu', 'edu.in', 'ac.in', 'ac.uk'];
  const allowedDomains = (process.env.COLLEGE_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  const normalizedEmail = normalizeEmail(email);
  const emailDomain = normalizedEmail.split('@')[1] || '';

  if (allowedDomains.length > 0) {
    return allowedDomains.includes(emailDomain);
  }

  return allowedSuffixes.some((suffix) =>
    emailDomain === suffix || emailDomain.endsWith(`.${suffix}`)
  );
};

// Signup
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    if (!isCollegeEmail(email)) {
      return res.status(400).json({
        message: 'Please sign up with a valid college email address'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Student ID card is required for signup'
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ $or: [{ username }, { email: normalizedEmail }] });
    if (existingUser) {
      return res.status(400).json({ message: existingUser.username === username ? 'Username already exists' : 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      verificationDocuments: {
        idDocument: `${SERVER_URL}/uploads/${req.file.filename}`,
      },
      verificationStatus: 'pending',
      isVerified: false,
    });

    res.status(201).json({
      message: 'Signup successful. Your account is pending admin verification for selling.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Login
exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: { $regex: `^\\s*${escapeRegex(normalizedEmail)}\\s*$`, $options: 'i' } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Logging in user:', user._id, user.email, 'with input email:', email);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: rememberMe ? '7d' : '2h'
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// Verify

exports.verify = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("username isAdmin _id isVerified verificationStatus");
    console.log('Verifying user:', user._id, user.username);
    res.json({
      username: user.username,
      _id: user._id,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};


