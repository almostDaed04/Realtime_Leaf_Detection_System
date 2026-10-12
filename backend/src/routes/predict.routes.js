const express = require('express');
const rateLimit = require('express-rate-limit');
const { predict } = require('../controllers/predict.controller');
const { requireAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Rate limit for prediction endpoint to manage AI service load
const predictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 predictions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many prediction requests. Please wait before trying again.' },
});

// POST /api/predict — F.2 through F.8
router.post(
  '/',
  requireAuth,
  predictLimiter,
  upload.single('image'),
  handleMulterError,
  predict
);

module.exports = router;
