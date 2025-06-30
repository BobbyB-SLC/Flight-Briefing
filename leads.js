const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

function buildSearchURL(city, type) {
  const formattedCity = encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'));
  const formattedType = encodeURIComponent(type.toLowerCase().replace(/\s+/g, '+'));
  return `https://www.yellowpages.com/search?search_terms=${formattedType}&geo_location_terms=${formattedCity}%2C+nc`;
}

function generatePrompt(biz, city, type) {
  return `Hi ${biz.name}, I'm Bobby with Sky Lens Carolina — a veteran-owned drone service based right here in NC. I noticed you're a ${type.toLowerCase()} in ${city}, and I wanted to offer FAA-certified aerial photography that helps listings stand out and sell faster. We specialize in high-resolution drone imagery, amenity flyovers, and boundary overlays. Let's elevate your next listing together.`;
}

router.post('/leads', async (req, res) => {
  const { city, type } = req.body;
  const url = buildSearchURL(city, type);

  try {
    const response = await axios.get(url, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});


    const $ = cheerio.load(data);
    const results = [];

    $('.info').each((i, el) => {
      const name = $(el).find('a.business-name span').text().trim();
      const phone = $(el).find('.phones').text().trim();
      const website = $(el).find('.links a.track-visit-website').attr('href') || '';
      const address = $(el).find('.street-address').text().trim() + ', ' + $(el).find('.locality').text().trim();

      if (name) {
        results.push({
          name,
          phone,
          website: website.startsWith('http') ? website : `https://www.yellowpages.com${website}`,
          address,
          prompt: generatePrompt({ name }, city, type)
        });
      }
    });

    res.json(results);
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: 'Failed to scrape leads.' });
  }
});

module.exports = router;
