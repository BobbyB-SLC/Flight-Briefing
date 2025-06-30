const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = 'AIzaSyBGP1srzJSJ0pNQRQ7uAZMOLvRTgtLCWyI';

function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service based right here in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography that helps listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let's elevate your next listing together.`;
}

router.post('/leads', async (req, res) => {
  const { city, type } = req.body;
  const query = `${type} in ${city}, NC`;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`,
      {
        params: {
          query,
          key: API_KEY,
        },
      }
    );

    const results = response.data.results.map(place => ({
      name: place.name,
      address: place.formatted_address || '',
      website: place.website || '',
      place_id: place.place_id,
      prompt: generatePrompt({ name: place.name }, city, type)
    }));

    res.json(results);
  } catch (err) {
    console.error('Google Places API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

module.exports = router;
