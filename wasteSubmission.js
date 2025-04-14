const mongoose = require('mongoose');

const wasteSubmissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  wasteType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number
  },
  unit: {
    type: String
  },
  location: {
    type: String
  },
  imageUrl: {
    type: String
  },
  description: {
    type: String
  },
  classification: {
    type: String // This will be populated by the AI classifier
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WasteSubmission = mongoose.model('WasteSubmission', wasteSubmissionSchema);

module.exports = WasteSubmission;