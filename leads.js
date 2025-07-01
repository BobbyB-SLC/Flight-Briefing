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

  console.log(`🛰️ Querying Google Places for: ${location}`);
  console.log(`🔐 Using API Key: ${apiKey ? '[REDACTED]' : 'MISSING!'}`);

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
  params: {
    query: location,
    key: apiKey  // This should be `apiKey`, not `GOOGLE_API_KEY`
    console.log('Google Places API response:', response.data);

  }
});

console.log('📦 Google API raw response:', JSON.stringify(response.data, null, 2));


    const places = response.data.results;

    console.log(`✅ Found ${places.length} results from Google Places`);
    console.dir(places, { depth: null });

    if (!places.length) {
      return res.status(200).json([]);
    }

    const leads = places.map(place => ({
      name: place.name,
      address: place.formatted_address || 'No address available',
      prompt: generatePrompt({ name: place.name }, city, type)
    }));

    res.json(leads);
  } catch (err) {
    console.error('❌ Google Places API error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads from Google Places API.' });
  }
});

module.exports = router;
