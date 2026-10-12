const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 5000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Universal email sender:
 * 1. Uses Resend HTTP API (port 443) if RESEND_API_KEY is set (recommended on Render)
 * 2. Uses Brevo HTTP API (port 443) if BREVO_API_KEY is set
 * 3. Falls back to Nodemailer SMTP for local development
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // Option 1: Resend HTTP API (Port 443 — Render Free Tier never blocks this)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'LeafScan <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error (${res.status}): ${err}`);
    }
    console.log(`[MAILER] Email successfully sent to ${to} via Resend HTTP API`);
    return await res.json();
  }

  // Option 2: Brevo HTTP API (Port 443)
  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'LeafScan', email: process.env.SMTP_FROM || process.env.SMTP_USER || 'leafscan.alerts@gmail.com' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Brevo API error (${res.status}): ${err}`);
    }
    console.log(`[MAILER] Email successfully sent to ${to} via Brevo HTTP API`);
    return await res.json();
  }

  // Option 3: SMTP (Localhost / development)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return await transporter.sendMail({
      from: `"LeafScan" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
  }

  console.warn(`[MAILER] No email service configured. Set RESEND_API_KEY, BREVO_API_KEY, or SMTP credentials.`);
};

const sendVerificationEmail = async (toEmail, code) => {
  try {
    await sendEmail({
      to: toEmail,
      subject: 'Your LeafScan verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4fdf8; padding: 40px 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #059669; font-size: 28px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;">
              LeafScan 🌿
            </h2>
          </div>
          <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: center;">
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px; line-height: 1.5;">
              Hello, <br/><br/>
              Thank you for using LeafScan! Please use the verification code below to securely verify your account:
            </p>
            <div style="background-color: #ecfdf5; border: 2px dashed #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h1 style="color: #047857; font-size: 36px; letter-spacing: 6px; margin: 0;">
                ${code}
              </h1>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              ⚠️ This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} LeafScan. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error(`[MAILER ERROR] Failed to send verification email to ${toEmail}:`, error.message);
    console.log(`[MAILER FALLBACK OTP] Code for ${toEmail}: ${code}`);
  }
};

const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  try {
    await sendEmail({
      to: toEmail,
      subject: 'Reset your LeafScan password',
      text: `Use this link to reset your password: ${resetUrl}\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f4fdf8;border-radius:12px"><h2 style="color:#059669">LeafScan password reset</h2><p>We received a request to reset your password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#059669;color:white;text-decoration:none;border-radius:8px">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p></div>`,
    });
  } catch (error) {
    console.error(`[MAILER ERROR] Failed to send password reset email to ${toEmail}:`, error.message);
  }
};

const sendSignInNotification = async (toEmail) => {
  try {
    const signInTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', timeZoneName: 'short' });
    await sendEmail({
      to: toEmail,
      subject: 'New sign in to your LeafScan account',
      text: `Your LeafScan account was signed in to at ${signInTime}. If this was not you, reset your password immediately.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f4fdf8;border-radius:12px"><h2 style="color:#059669">New sign in to LeafScan</h2><p>Your account was signed in to at <strong>${signInTime}</strong>.</p><p>If this was not you, reset your password immediately and contact your administrator if you need help.</p></div>`,
    });
  } catch (error) {
    console.error('[MAILER ERROR] Sign in notification failed:', error.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSignInNotification,
};
