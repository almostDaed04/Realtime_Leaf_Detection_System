const Prediction = require('../models/Prediction');

/**
 * GET /api/history?page=&limit=
 * Paginated list of the caller's own predictions. Maps to F.9.
 */
const getHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [predictions, total] = await Promise.all([
      Prediction.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments({ userId: req.user._id }),
    ]);

    // Strip thumbnail data from list response (fetched separately)
    const sanitized = predictions.map(({ thumbnail, __v, ...pred }) => pred);

    res.json({
      predictions: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/history/:id/thumbnail
 * Serve the thumbnail image for a specific prediction.
 * Owner-only access — enforces NF.5 (even admins are denied).
 */
const getThumbnail = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .select('userId thumbnail');

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    // Strict owner-only access — admins explicitly denied per F.10/NF.5
    if (prediction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'You do not have permission to view this image.',
      });
    }

    if (!prediction.thumbnail || !prediction.thumbnail.data) {
      return res.status(404).json({ error: 'Thumbnail not available.' });
    }

    res.set('Content-Type', prediction.thumbnail.contentType);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(prediction.thumbnail.data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/history/report
 * Export history as CSV
 */
const exportHistoryCSV = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .lean();
    
    let csvStr = "Date,Species,Confidence(%)\n";
    predictions.forEach(p => {
      const date = p.timestamp ? new Date(p.timestamp).toLocaleString() : "";
      const species = p.species || "Unknown";
      const conf = p.confidenceScore ? p.confidenceScore.toFixed(2) : "0.00";
      csvStr += `"${date}","${species}","${conf}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('leafscan_report.csv');
    return res.send(csvStr);
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getThumbnail, exportHistoryCSV };
