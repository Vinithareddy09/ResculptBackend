// models/creatorProfile.js
const mongoose = require('mongoose');

const creatorProfileSchema = new mongoose.Schema({
  userId: {
    type: [String],
    ref: 'User', // Assuming we'll have a User model later
    required: true,
    unique: true // One profile per user
  },
  expertise: {
    type: [String], // Array of areas of expertise (e.g., "upcycling plastic", "jewelry making")
    default: []
  },
  materialsNeeded: {
    type: [String], // Array of materials they are looking for (e.g., "plastic bottles", "old fabric")
    default: []
  },
  portfolio: {
    type: [String], // Array of URLs to their portfolio or examples of work
    default: []
  },
  bio: {
    type: String
  },
  contactInformation: {
    email: {
      type: String
    },
    phone: {
      type: String
    },
    socialMedia: {
      type: [String], // Array of social media links
      default: []
    }
  },
  location: {
    type: String // Optional location for local collaborations
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

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

module.exports = CreatorProfile;