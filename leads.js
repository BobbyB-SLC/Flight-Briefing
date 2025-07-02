const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY;
console.log('🔑 Loaded API key:', apiKey ? 'Present' : 'Missing');

// Prompt Generator
function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography to help listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let's elevate your next listing together.`;
}

// Fetch all results using next_page_token pagination
async function fetchAllPlaces(query, key) {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
  let allResults = [];
  let attempts = 0;

  while (url && attempts < 3) {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google API Error:', data.status);
      break;
    }

    if (data.results) {
      allResults.push(...data.results);
    }

    if (data.next_page_token) {
      // Must wait before using next_page_token
      await new Promise(resolve => setTimeout(resolve, 2000));
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${key}`;
    } else {
      url = null;
    }

    attempts++;
  }

  return allResults;
}

// Route Handler
router.post('/leads', async (req, res) => {
  const { city, type } = req.body;
  const query = `${type} in ${city}, NC`;

  try {
    const places = await fetchAllPlaces(query, apiKey);

    const leads = places.map(place => ({
      name: place.name,
      address: place.formatted_address || 'No address available',
      phone: place.formatted_phone_number || 'N/A',
      website: place.website || 'N/A',
      prompt: generatePrompt({ name: place.name }, city, type)
    }));

    res.json(leads);
  } catch (err) {
    console.error('🔥 Server Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

module.exports = router;
