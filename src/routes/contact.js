const express = require('express');
const nodemailer = require('nodemailer');
const pool = require('../utils/RenderDbConnection.js');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_TO = process.env.CONTACT_TO || 'G-fuel-ecommerce@proton.me';

// Simple per-IP limit so the form cannot be used to flood the inbox.
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

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;
if (!smtpConfigured) {
  console.warn('SMTP is not configured: contact messages are saved to the database but not emailed.');
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// POST /api/contact
router.post('/', async (req, res) => {
  const body = req.body || {};
  const name = clean(body.name, 100);
  const email = clean(body.email, 255);
  const phone = clean(body.phone, 30);
  const message = clean(body.message, 5000);

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone and message are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  }

  let id;
  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, phone, message]
    );
    id = result.rows[0].id;
  } catch (error) {
    console.error('Contact save error:', error);
    return res.status(500).json({ error: 'Could not save your message' });
  }

  let emailSent = false;
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: CONTACT_TO,
        replyTo: email,
        subject: `G-Fuel contact form: message from ${name.replace(/[\r\n]+/g, ' ')}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}\n`,
      });
      emailSent = true;
      await pool.query('UPDATE contact_messages SET email_sent = TRUE WHERE id = $1', [id]);
    } catch (error) {
      console.error('Contact email error:', error.message);
    }
  }

  res.status(201).json({ id, emailSent });
});

module.exports = router;
