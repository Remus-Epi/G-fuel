const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/RenderDbConnection.js');
const { sendMail, mailConfigured } = require('../utils/mailer.js');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL = '1h';
const RESET_TTL_MS = 60 * 60 * 1000;
const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;

// Per-IP limit for the reset endpoints (in memory, like the contact form).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters long' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, created_at`,
      [email.trim(), passwordHash, firstName || null, lastName || null]
    );
    const user = result.rows[0];
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, created_at
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );
    const user = result.rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const FORGOT_MESSAGE = 'If an account exists for that email, a reset link has been sent.';

// POST /api/auth/forgot-password  body: { email }
// Always answers the same way, so the endpoint cannot be used to find registered emails.
router.post('/forgot-password', async (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  const email = typeof (req.body || {}).email === 'string' ? req.body.email.trim() : '';
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    const user = result.rows[0];
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TTL_MS);
      await pool.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [user.id]);
      await pool.query(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, sha256(token), expiresAt]
      );
      const link = `${APP_URL}/password/reset/index.html?token=${token}`;
      const sent = await sendMail({
        to: user.email,
        subject: 'Reset your G-Fuel password',
        text: `We received a request to reset your password.\n\nOpen this link within 1 hour:\n${link}\n\nIf you did not ask for this, ignore this email.`,
      });
      // Without SMTP the link can only be read from the server log, and only outside production.
      if (!sent && !mailConfigured && process.env.NODE_ENV !== 'production') {
        console.log(`[dev] Password reset link for ${user.email}: ${link}`);
      }
    }
    res.json({ message: FORGOT_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Could not start the password reset. Please try again.' });
  }
});

// POST /api/auth/reset-password  body: { token, password }
router.post('/reset-password', async (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters long' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT user_id FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [sha256(token)]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }
    const userId = found.rows[0].user_id;
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    await client.query(
      'UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );
    await client.query('COMMIT');
    res.json({ message: 'Your password has been changed. You can log in now.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Could not reset the password. Please try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;
