const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const secret = process.env.JWT_SECRET || 'caletracker_secret_jwt_key_2026_super_secure';

function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const displayName = (name && name.trim()) || normalizedEmail.split('@')[0];

    // New registrations are unverified by default (is_verified = 0)
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES (?, ?, ?, 'user', 0)
    `);
    const info = insertStmt.run(displayName, normalizedEmail, hashedPassword);
    const newUserId = info.lastInsertRowid;

    const token = jwt.sign(
      { id: newUserId, email: normalizedEmail, role: 'user', is_verified: false, name: displayName },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully (verification pending)',
      token,
      user: {
        id: newUserId,
        name: displayName,
        email: normalizedEmail,
        role: 'user',
        is_verified: false
      }
    });
  } catch (error) {
    console.error('[AuthController.register]', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}

function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isVerified = Boolean(user.is_verified);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_verified: isVerified, name: user.name },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: isVerified
      }
    });
  } catch (error) {
    console.error('[AuthController.login]', error);
    return res.status(500).json({ success: false, message: 'Server error during sign in' });
  }
}

function getMe(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: Boolean(user.is_verified),
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('[AuthController.getMe]', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
