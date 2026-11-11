// Sends transactional email over SMTP when it is configured (see .env.example).
const nodemailer = require('nodemailer');

const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// Resolves to true when the message was handed to the SMTP server.
async function sendMail({ to, subject, text }) {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error('Mail error:', error.message);
    return false;
  }
}

module.exports = { sendMail, mailConfigured: configured };
