const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY;
console.log('🔑 Loaded API key:', apiKey ? 'Present' : 'Missing');


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
        key: process.env.GOOGLE_API_KEY
      }
    });

    console.log('Google Places API response:', response.data); // ✅ Now inside try block

    const places = response.data.results;

    const leads = places.map(place => ({
      name: place.name,
      address: place.formatted_address || 'No address available',
      prompt: generatePrompt({ name: place.name }, city, type)
    }));

    res.json(leads);
  } catch (err) {
    console.error('Google Places error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});


module.exports = router;
