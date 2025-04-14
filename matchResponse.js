// models/matchResponse.js
const mongoose = require('mongoose');

const matchResponseSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    unique: true // Assuming one response per match
  },
  response: {
    type: String,
    enum: ['accepted', 'rejected'],
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  },
  // You might want to add a userId of the creator who responded (if you have user authentication)
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const MatchResponse = mongoose.model('MatchResponse', matchResponseSchema);

module.exports = MatchResponse;