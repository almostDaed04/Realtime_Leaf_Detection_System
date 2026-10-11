const mongoose = require('mongoose');

const SPECIES = [
  'Guava',
  'Lemon',
  'Lychee',
  'Mango',
  'Olive',
];

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  species: {
    type: String,
    required: [true, 'Species is required'],
    enum: {
      values: SPECIES,
      message: '{VALUE} is not a supported species',
    },
  },
  confidenceScore: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence score must be at least 0'],
    max: [100, 'Confidence score cannot exceed 100'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  thumbnail: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png'],
    },
  },
  // NOTE: No full-resolution image field — deleted after inference (F.8)
});

// Compound index for paginated history queries sorted by time
predictionSchema.index({ userId: 1, timestamp: -1 });

// Remove thumbnail data from default JSON (fetch separately via dedicated endpoint)
predictionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.thumbnail;
  delete obj.__v;
  return obj;
};

// Static: get species list
predictionSchema.statics.getSpecies = function () {
  return SPECIES;
};

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
