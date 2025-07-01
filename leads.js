const express = require('express');
const router = express.Router();
const axios = require('axios');

const GOOGLE_API_KEY = 'AIzaSyBGP1srzJSJ0pNQRQ7uAZMOLvRTgtLCWyI';

function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography that helps listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let’s elevate your next listing together.`;
}

router.post('/leads', async (req, res) => {
  const { city, type } = req.body;

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(type + ' in ' + city + ', NC')}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    const leads = results.map(place => {
      const name = place.name;
      const address = place.formatted_address;
      const website = place.website || '';
      const phone = place.formatted_phone_number || '';
      return {
        name,
        address,
        phone,
        website,
        prompt: generatePrompt({ name }, city, type)
      };
    });

    res.json(leads);
  } catch (error) {
    console.error('Google API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leads from Google Places API.' });
  }
});

module.exports = router;
