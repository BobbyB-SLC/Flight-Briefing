const express = require('express');
const router = express.Router();
const axios = require('axios');

console.log('API Key from .env:', process.env.GOOGLE_MAPS_API_KEY); // ✅ Debug log here


const apiKey = process.env.GOOGLE_API_KEY;



function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography to help listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let's elevate your next listing together.`;
}

router.post('/leads', async (req, res) => {
  const { city, type } = req.body;

  const location = `${type} in ${city}, NC`;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
  query: location,
  key: apiKey
}

      }
    });

    const places = response.data.results;

    const leads = places.map(place => ({
      name: place.name,
      address: place.formatted_address || 'No address available',
      website: 'Website unavailable from this API',
      prompt: generatePrompt({ name: place.name }, city, type)
    }));

    res.json(leads);
  } catch (err) {
    console.error('Google Places error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

module.exports = router;


