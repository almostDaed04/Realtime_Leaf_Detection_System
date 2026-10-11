const express = require('express');
const { getHistory, getThumbnail, exportHistoryCSV } = require('../controllers/history.controller');
const { requireAuth } = require('../middleware/auth');
const { validate, paginationSchema } = require('../middleware/validate');

const router = express.Router();

// All history routes require authentication
router.use(requireAuth);

// GET /api/history?page=&limit= — F.9
router.get('/', validate(paginationSchema, 'query'), getHistory);

// GET /api/history/report - Export CSV
router.get('/report', exportHistoryCSV);

// GET /api/history/:id/thumbnail — F.9, NF.5 (owner-only)
router.get('/:id/thumbnail', getThumbnail);

module.exports = router;
