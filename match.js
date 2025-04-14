// models/match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  wasteSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteSubmission',
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatorProfile',
    required: true
  },
  matchConfidence: {
    type: Number, // Optional: If the matching is AI-driven, store the confidence score
    min: 0,
    max: 1
  },
  matchDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;