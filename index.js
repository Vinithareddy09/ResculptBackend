// Import the Express.js library
const express = require('express');
const mongoose = require('mongoose');
const WasteSubmission = require('./models/wasteSubmission'); // Import the model at the top
const CreatorProfile = require('./models/creatorProfile');
const Match = require('./models/match');
const MatchResponse = require('./models/matchResponse');
const Blockchain = require('./blockchain_sim/blockchain');
// Create an instance of an Express application
const app = express();
const userRewardNFTs = {}; // In-memory object to track user-awarded NFTs
let nextRewardNFTId = 1; // Simple counter for NFT IDs
// Enable JSON body parsing
app.use(express.json());
const reSculptBlockchain = new Blockchain();
console.log('Simulated Blockchain Initialized:', reSculptBlockchain.chain);

// In-memory object to store user carbon credit balances
const userCarbonCredits = {};
const creditsPerWasteUnit = {
    'plastic': 0.5,
    'textile': 1,
    'ewaste': 2,
    'organic': 0.2
};

async function matchWasteWithCreators(wasteSubmission) {
    try {
        const creators = await CreatorProfile.find({
            materialsNeeded: { $in: [wasteSubmission.wasteType] }
        });

        for (const creator of creators) {
            const existingMatch = await Match.findOne({
                wasteSubmissionId: wasteSubmission._id,
                creatorId: creator._id
            });

            if (!existingMatch) {
                const newMatch = new Match({
                    wasteSubmissionId: wasteSubmission._id,
                    creatorId: creator._id,
                    // You could add a basic confidence score here if needed
                });
                await newMatch.save();
                console.log(`Match created: Waste ${wasteSubmission._id} with Creator ${creator._id}`);
            }
        }
    } catch (error) {
        console.error('Error matching waste with creators:', error);
    }
}

async function matchCreatorWithWaste(creatorProfile) {
    try {
        const wasteSubmissions = await WasteSubmission.find({
            wasteType: { $in: creatorProfile.materialsNeeded }
        });

        for (const waste of wasteSubmissions) {
            const existingMatch = await Match.findOne({
                wasteSubmissionId: waste._id,
                creatorId: creatorProfile._id
            });

            if (!existingMatch) {
                const newMatch = new Match({
                    wasteSubmissionId: waste._id,
                    creatorId: creatorProfile._id,
                    // You could add a basic confidence score here
                });
                await newMatch.save();
                console.log(`Match created: Creator ${creatorProfile._id} with Waste ${waste._id}`);
            }
        }
    } catch (error) {
        console.error('Error matching creator with waste:', error);
    }
}


// Replace with your actual MongoDB connection string from Atlas
const mongoURI = 'mongodb+srv://resculpt_user:vennelasara@resculpt-cluster.gzkojvo.mongodb.net/?retryWrites=true&w=majority&appName=resculpt-cluster';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB Atlas', err));

// Define the port the server will listen on
const port = 3000;

// Define a simple route for the root path ('/')
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Create the /api/waste/upload POST route
app.post('/api/waste/upload', async (req, res) => {
    const { userId, wasteType, quantity, unit, location, imageUrl, description } = req.body;

    // Basic input validation
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID is required.' });
    }
    if (!wasteType || typeof wasteType !== 'string' || wasteType.trim() === '') {
        return res.status(400).json({ error: 'Waste type is required.' });
    }
    if (quantity !== undefined && typeof quantity !== 'number' && (typeof quantity !== 'string' || isNaN(Number(quantity)))) {
        return res.status(400).json({ error: 'Quantity must be a number.' });
    }
    if (unit !== undefined && typeof unit !== 'string') {
        return res.status(400).json({ error: 'Unit must be a string.' });
    }
    if (location !== undefined && typeof location !== 'string') {
        return res.status(400).json({ error: 'Location must be a string.' });
    }
    if (imageUrl !== undefined && typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'Image URL must be a string.' });
    }
    if (description !== undefined && typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string.' });
    }

    try {
        const newWaste = new WasteSubmission({
            userId,
            wasteType,
            quantity: quantity !== undefined ? quantity : undefined, // Handle optional fields
            unit: unit !== undefined ? unit : undefined,
            location: location !== undefined ? location : undefined,
            imageUrl: imageUrl !== undefined ? imageUrl : undefined,
            description: description !== undefined ? description : undefined,
            // We'll add classification later
        });

        const savedWaste = await newWaste.save();
        matchWasteWithCreators(savedWaste);

        // Award simulated carbon credits
        const credits = calculateCarbonCredits(wasteType, quantity);
        if (userId) {
            userCarbonCredits[userId] = (userCarbonCredits[userId] || 0) + credits;
            console.log(`Awarded ${credits} carbon credits to user ${userId}. New balance: ${userCarbonCredits[userId]}`);
        }

        res.status(201).json({ message: 'Waste upload successful!', data: savedWaste, carbonCreditsAwarded: credits, userCreditBalance: userCarbonCredits[userId] || 0 });

    } catch (error) {
        console.error('Error uploading waste:', error);
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const key in error.errors) {
                errors[key] = error.errors[key].message;
            }
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        res.status(500).json({ error: 'Failed to upload waste.' });
    }
});

// Simple function to calculate simulated carbon credits
function calculateCarbonCredits(wasteType, quantity) {
    if (quantity === undefined || quantity <= 0 || !creditsPerWasteUnit[wasteType.toLowerCase()]) {
        return 0;
    }
    return quantity * creditsPerWasteUnit[wasteType.toLowerCase()];
}

// New endpoint to get a user's carbon credit balance
app.get('/api/carbon-credits/:userId', (req, res) => {
    const userId = req.params.userId;
    const balance = userCarbonCredits[userId] || 0;
    res.status(200).json({ userId: userId, balance: balance });
});


app.get('/api/waste/', async (req, res) => {
    try {
        const allWaste = await WasteSubmission.find();
        res.status(200).json(allWaste);
    } catch (error) {
        console.error('Error fetching all waste:', error);
        res.status(500).json({ error: 'Failed to fetch waste data.' });
    }
});

app.get('/api/waste/:id', async (req, res) => {
    try {
        const wasteId = req.params.id;
        const waste = await WasteSubmission.findById(wasteId);

        if (!waste) {
            return res.status(404).json({ message: 'Waste submission not found.' });
        }

        res.status(200).json(waste);
    } catch (error) {
        console.error('Error fetching waste by ID:', error);
        // Handle potential invalid ObjectId errors
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Waste ID format.' });
        }
        res.status(500).json({ error: 'Failed to fetch waste data by ID.' });
    }
});

app.put('/api/waste/:id', async (req, res) => {
    const { userId, wasteType, quantity, unit, location, imageUrl, description } = req.body;
    const wasteId = req.params.id;

    // Basic input validation (you might want to reuse or refine this)
    if (userId !== undefined && (typeof userId !== 'string' || userId.trim() === '')) {
        return res.status(400).json({ error: 'User ID must be a string.' });
    }
    if (wasteType !== undefined && (typeof wasteType !== 'string' || wasteType.trim() === '')) {
        return res.status(400).json({ error: 'Waste type must be a string.' });
    }
    if (quantity !== undefined && typeof quantity !== 'number' && (typeof quantity !== 'string' || isNaN(Number(quantity)))) {
        return res.status(400).json({ error: 'Quantity must be a number.' });
    }
    if (unit !== undefined && typeof unit !== 'string') {
        return res.status(400).json({ error: 'Unit must be a string.' });
    }
    if (location !== undefined && typeof location !== 'string') {
        return res.status(400).json({ error: 'Location must be a string.' });
    }
    if (imageUrl !== undefined && typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'Image URL must be a string.' });
    }
    if (description !== undefined && typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string.' });
    }

    try {
        const updatedWaste = await WasteSubmission.findByIdAndUpdate(
            wasteId,
            {
                userId,
                wasteType,
                quantity: quantity !== undefined ? quantity : undefined,
                unit: unit !== undefined ? unit : undefined,
                location: location !== undefined ? location : undefined,
                imageUrl: imageUrl !== undefined ? imageUrl : undefined,
                description: description !== undefined ? description : undefined,
                // You might want to update classification later
            },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedWaste) {
            return res.status(404).json({ message: 'Waste submission not found.' });
        }

        res.status(200).json({ message: 'Waste submission updated successfully!', data: updatedWaste });
    } catch (error) {
        console.error('Error updating waste:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Waste ID format.' });
        }
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const key in error.errors) {
                errors[key] = error.errors[key].message;
            }
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        res.status(500).json({ error: 'Failed to update waste data.' });
    }
});

app.delete('/api/waste/:id', async (req, res) => {
    const wasteId = req.params.id;

    try {
        const deletedWaste = await WasteSubmission.findByIdAndDelete(wasteId);

        if (!deletedWaste) {
            return res.status(404).json({ message: 'Waste submission not found.' });
        }

        res.status(200).json({ message: 'Waste submission deleted successfully!' });
    } catch (error) {
        console.error('Error deleting waste:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Waste ID format.' });
        }
        res.status(500).json({ error: 'Failed to delete waste data.' });
    }
});

// Route to register a new creator profile
app.post('/api/creators/register', async (req, res) => {
    try {
        const { userId, expertise, materialsNeeded, portfolio, bio, contactInformation, location } = req.body;

        // Basic validation (you might want more comprehensive validation later)
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const existingProfile = await CreatorProfile.findOne({ userId });
        if (existingProfile) {
            return res.status(409).json({ error: 'Creator profile already exists for this user.' });
        }

        const newProfile = new CreatorProfile({
            userId,
            expertise,
            materialsNeeded,
            portfolio,
            bio,
            contactInformation,
            location
        });

        const savedProfile = await newProfile.save();
        matchCreatorWithWaste(savedProfile);
        res.status(201).json({ message: 'Creator profile registered successfully!', data: savedProfile });
    } catch (error) {
        console.error('Error registering creator profile:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to register creator profile.' });
    }
});

// Route to retrieve creator details by ID
app.get('/api/creators/:creatorId', async (req, res) => {
    const creatorId = req.params.creatorId;

    try {
        const creatorProfile = await CreatorProfile.findById(creatorId);

        if (!creatorProfile) {
            return res.status(404).json({ message: 'Creator profile not found.' });
        }

        res.status(200).json(creatorProfile);
    } catch (error) {
        console.error('Error fetching creator profile:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Creator ID format.' });
        }
        res.status(500).json({ error: 'Failed to fetch creator profile.' });
    }
});

// Route for a creator to update their material needs
app.put('/api/creators/:creatorId/needs', async (req, res) => {
    const creatorId = req.params.creatorId;
    const { materialsNeeded } = req.body;

    try {
        const updatedProfile = await CreatorProfile.findByIdAndUpdate(
            creatorId,
            { materialsNeeded },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: 'Creator profile not found.' });
        }

        res.status(200).json({ message: 'Creator material needs updated!', data: updatedProfile });
    } catch (error) {
        console.error('Error updating creator material needs:', error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Creator ID format.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update creator material needs.' });
    }
});

// Route to retrieve all matches (you'll likely add filtering later)
app.get('/api/matches/', async (req, res) => {
    try {
        const allMatches = await Match.find().populate('wasteSubmissionId').populate('creatorId');
        res.status(200).json(allMatches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches.' });
    }
});


app.put('/api/matches/accept/:matchId', async (req, res) => {
    const matchId = req.params.matchId;

    try {
        const updatedMatch = await Match.findByIdAndUpdate(
            matchId,
            { status: 'accepted' },
            { new: true }
        );

        if (!updatedMatch) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        // Create a new MatchResponse record
        const newResponse = new MatchResponse({
            matchId: matchId,
            response: 'accepted'
        });
        await newResponse.save();
        console.log(`Match ${matchId} accepted and response recorded.`);

        res.status(200).json({message: 'Match accepted!', data: updatedMatch });
      } catch (error) {
          console.error('Error accepting match:', error);
          if (error.name === 'CastError' && error.kind === 'ObjectId') {
              return res.status(400).json({ message: 'Invalid Match ID format.' });
          }
          if (error.name === 'MongoServerError' && error.code === 11000) {
              return res.status(409).json({ message: 'Response already recorded for this match.' });
          }
          res.status(500).json({ error: 'Failed to accept match.' });
      }
  });
  app.put('/api/matches/reject/:matchId', async (req, res) => {
      const matchId = req.params.matchId;
  
      try {
          const updatedMatch = await Match.findByIdAndUpdate(
              matchId,
              { status: 'rejected' },
              { new: true }
          );
  
          if (!updatedMatch) {
              return res.status(404).json({ message: 'Match not found.' });
          }
  
          // Create a new MatchResponse record
          const newResponse = new MatchResponse({
              matchId: matchId,
              response: 'rejected'
          });
          await newResponse.save();
          console.log(`Match ${matchId} rejected and response recorded.`);
  
          res.status(200).json({ message: 'Match rejected!', data: updatedMatch });
      } catch (error) {
          console.error('Error rejecting match:', error);
          if (error.name === 'CastError' && error.kind === 'ObjectId') {
              return res.status(400).json({ message: 'Invalid Match ID format.' });
          }
          if (error.name === 'MongoServerError' && error.code === 11000) {
              return res.status(409).json({ message: 'Response already recorded for this match.' });
          }
          res.status(500).json({ error: 'Failed to reject match.' });
      }
  });
  
  
  app.post('/api/products/mint-nft', async (req, res) => {
      const { productName, productDescription, associatedWasteSubmissionIds, creatorId } = req.body;
  
      if (!productName || !creatorId || !associatedWasteSubmissionIds || !Array.isArray(associatedWasteSubmissionIds) || associatedWasteSubmissionIds.length === 0) {
          return res.status(400).json({ error: 'Product name, creator ID, and at least one associated waste ID are required.' });
      }
  
      const productData = {
          productName,
          productDescription,
          wasteSubmissionIds: associatedWasteSubmissionIds, // Pass the waste IDs
          creatorId
      };
  
      reSculptBlockchain.minePendingTransactions(productData);
  
      res.status(201).json({ message: 'Simulated NFT "minted" and recorded on the blockchain with traceability!', chain: reSculptBlockchain.chain });
  });
  
  
  app.post('/api/rewards/award-nft/:userId', async (req, res) => {
    const { nftType, description } = req.body;
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required to award an NFT.' });
    }
    if (!nftType) {
        return res.status(400).json({ error: 'NFT type is required.' });
    }

    const newNFTId = `rewardNFT-${nextRewardNFTId++}`;
    const nftData = {
        id: newNFTId,
        type: nftType,
        description: description || `A reward NFT of type ${nftType}`,
        awardedTimestamp: Date.now()
    };

    userRewardNFTs[userId] = (userRewardNFTs[userId] || []).concat(nftData);

    res.status(201).json({ message: `Reward NFT "${newNFTId}" awarded to user ${userId}!`, nft: nftData, userNFTs: userRewardNFTs[userId] });
});

// New endpoint to get a user's awarded NFTs
app.get('/api/rewards/nfts/:userId', (req, res) => {
    const userId = req.params.userId;
    const nfts = userRewardNFTs[userId] || [];
    res.status(200).json({ userId: userId, nfts: nfts });
});



  // Start the server and listen on the specified port
  app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
  });