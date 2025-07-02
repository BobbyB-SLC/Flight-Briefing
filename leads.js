const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY;
console.log('🔑 Loaded API key:', apiKey ? 'Present' : 'Missing');

// Fetch all paginated text search results
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
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait before using next_page_token
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${key}`;
    } else {
      url = null;
    }

    attempts++;
  }

  return allResults;
}

// Fetch additional place details (phone, website)
async function getPlaceDetails(placeId, key) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website&key=${key}`;
    const res = await axios.get(url);
    return res.data.result;
  } catch (err) {
    console.error(`Error fetching details for place_id ${placeId}:`, err.message);
    return {};
  }
}

// Route Handler
router.post('/leads', async (req, res) => {
  const { city, type } = req.body;
  const query = `${type} in ${city}, NC`;

  try {
    const places = await fetchAllPlaces(query, apiKey);

    const leads = [];

    for (const place of places) {
      const details = await getPlaceDetails(place.place_id, apiKey);

      leads.push({
        name: details.name || place.name,
        address: details.formatted_address || place.formatted_address || 'No address available',
        phone: details.formatted_phone_number || 'N/A',
        website: details.website || 'N/A'
      });

      await new Promise(resolve => setTimeout(resolve, 150)); // throttle API calls to avoid hitting quota
    }

    res.json(leads);
  } catch (err) {
    console.error('🔥 Server Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

module.exports = router;
