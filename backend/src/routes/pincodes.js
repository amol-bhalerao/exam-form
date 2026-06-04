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

function normalizeText(value) {
  return String(value || '').trim();
}

function fallbackLocations(pincode, message = 'Pincode details not found. Please verify and edit manually if needed.') {
  const pincodeData = PINCODE_DB[pincode];
  if (pincodeData) {
    return {
      success: true,
      pincode,
      locations: [{
        pincode,
        officeName: 'Post Office',
        district: pincodeData.district,
        state: pincodeData.state,
        taluka: pincodeData.taluka,
        village: pincodeData.village
      }]
    };
  }

  return {
    success: true,
    pincode,
    locations: [{
      pincode,
      officeName: 'Post Office',
      district: 'Maharashtra',
      state: 'Maharashtra',
      taluka: '',
      village: 'Please enter details manually'
    }],
    message
  };
}

function mapIndiaPostLocation(postOffice, pincode) {
  const officeName = normalizeText(postOffice?.Name);
  return {
    pincode,
    officeName,
    district: normalizeText(postOffice?.District),
    state: normalizeText(postOffice?.State),
    taluka: normalizeText(postOffice?.Block || postOffice?.Taluk || postOffice?.Division),
    village: normalizeText(officeName || postOffice?.Block || postOffice?.District),
    officeType: normalizeText(postOffice?.BranchType)
  };
}

/**
 * GET /api/pincodes/:pincode
 * Fetch address details for a given pincode
 * Uses India Post public API with local fallback data - users can edit manually
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' }
      });
      clearTimeout(timeout);

      if (response.ok) {
        const payload = await response.json();
        const postOffices = Array.isArray(payload?.[0]?.PostOffice) ? payload[0].PostOffice : [];
        const unique = new Map();
        for (const office of postOffices) {
          const location = mapIndiaPostLocation(office, pincode);
          const key = `${location.village}|${location.taluka}|${location.district}`;
          if (location.village && !unique.has(key)) {
            unique.set(key, location);
          }
        }

        const locations = Array.from(unique.values());
        if (locations.length) {
          return res.json({ success: true, pincode, locations });
        }
      }
    } catch (apiError) {
      clearTimeout(timeout);
      console.warn(`India Post pincode lookup failed for ${pincode}:`, apiError.message);
    }

    return res.json(fallbackLocations(pincode));

  } catch (error) {
    console.error(`Error processing pincode ${req.params.pincode}:`, error.message);
    res.json(fallbackLocations(req.params.pincode, 'Pincode lookup failed. Please enter details manually.'));
  }
});

export default router;
