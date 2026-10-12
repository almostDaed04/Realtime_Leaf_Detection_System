const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  verifyCode,
  resendCode,
  getMe,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/auth.controller');

const { requireAuth } = require('../middleware/auth');

const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../middleware/validate');

const router = express.Router();


// Rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// Limit OTP verification attempts
const codeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  validate: { xForwardedForHeader: false },
  message: {
    error: 'Too many attempts. Please request a new code.',
  },
});

router.use(authLimiter);


// Register
router.post(
  '/register',
  validate(registerSchema),
  register
);


// Login
router.post(
  '/login',
  validate(loginSchema),
  login
);

router.post('/forgot-password', validate(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);


// Verify OTP
router.post(
  '/verify-code',
  verifyCode
);


// Resend OTP
router.post(
  '/resend-code',
  resendCode
);


// Get current user
router.get(
  '/me',
  requireAuth,
  getMe
);


module.exports = router;
