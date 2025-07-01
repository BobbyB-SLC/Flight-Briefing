const express = require('express');
const router = express.Router();
const axios = require('axios');

const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE'; // replace with process.env version later

function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography that helps listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let’s elevate your next listing together.`;
}

router.post('/leads', async (req, res) => {
  const { city, type } = req.body;

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(type + ' in ' + city + ', NC')}&key=${GOOGLE_API_KEY}`;

  try {
    const searchResponse = await axios.get(searchUrl);
    const places = searchResponse.data.results.slice(0, 10); // limit for speed

    const detailedResults = await Promise.all(places.map(async (place) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${GOOGLE_API_KEY}`;
      const detailsResponse = await axios.get(detailsUrl);
      const details = detailsResponse.data.result;

      return {
        name: details.name,
        address: details.formatted_address,
        phone: details.formatted_phone_number || '',
        website: details.website || '',
        prompt: generatePrompt(details, city, type)
      };
    }));

    res.json(detailedResults);
  } catch (error) {
    console.error('Google Places API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch or process leads.' });
  }
});

module.exports = router;

