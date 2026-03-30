import express from 'express';

const router = express.Router();

// Mock pincode database for common Maharashtra pincodes
const PINCODE_DB = {
  '431703': { district: 'Hingoli', state: 'Maharashtra', taluka: 'Hingoli', village: 'Hingoli' },
  '431201': { district: 'Aurangabad', state: 'Maharashtra', taluka: 'Aurangabad', village: 'Aurangabad' },
  '410201': { district: 'Pune', state: 'Maharashtra', taluka: 'Pune', village: 'Pune' },
  '400001': { district: 'Mumbai', state: 'Maharashtra', taluka: 'Mumbai', village: 'Mumbai South' },
  '411001': { district: 'Pune', state: 'Maharashtra', taluka: 'Pune', village: 'Pune City' },
  '425001': { district: 'Jalgaon', state: 'Maharashtra', taluka: 'Jalgaon', village: 'Jalgaon' },
  '440001': { district: 'Nagpur', state: 'Maharashtra', taluka: 'Nagpur', village: 'Nagpur City' },
  '360001': { district: 'Rajkot', state: 'Gujarat', taluka: 'Rajkot', village: 'Rajkot' }
};

/**
 * GET /api/pincodes/:pincode
 * Fetch address details for a given pincode
 * Uses fallback data - users can edit manually
 */
router.get('/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;

    // Validate pincode format
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pincode format. Must be 6 digits.'
      });
    }

    // Check if pincode exists in our database
    const pincodeData = PINCODE_DB[pincode];
    
    if (pincodeData) {
      return res.json({
        success: true,
        pincode,
        locations: [{
          pincode: pincode,
          officeName: 'Post Office',
          district: pincodeData.district,
          state: pincodeData.state,
          taluka: pincodeData.taluka,
          village: pincodeData.village
        }]
      });
    }

    // For unknown pincodes, return generic response
    // User can edit location details manually
    return res.json({
      success: true,
      pincode,
      locations: [{
        pincode: pincode,
        officeName: 'Post Office',
        district: 'Maharashtra',
        state: 'Maharashtra',
        taluka: '',
        village: 'Please verify with postal authority'
      }],
      message: 'Pincode details not found. Please verify and edit manually if needed.'
    });

  } catch (error) {
    console.error(`Error processing pincode ${req.params.pincode}:`, error.message);
    
    // Return success with reference data even on error
    res.json({
      success: true,
      pincode: req.params.pincode,
      locations: [{
        pincode: req.params.pincode,
        officeName: 'Post Office',
        district: 'Maharashtra',
        state: 'Maharashtra',
        taluka: '',
        village: 'Please enter details manually'
      }]
    });
  }
});

export default router;
