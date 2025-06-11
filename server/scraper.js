// scraper.js with timeout fallbacks
const axios = require('axios');

async function getLatLonFromAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'SkyLensCarolinaDrone/1.0' }
    });
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

async function getMetarForLocation(lat, lon) {
  const station = 'KRDU';
  const url = `https://aviationweather.gov/cgi-bin/data/metar.php?ids=${station}&format=raw&hours=0&taf=off&layout=on`;
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const metar = response.data.trim().split('\n')[0];
    return metar || 'No METAR found';
  } catch (error) {
    console.error('METAR fetch error:', error.message);
    return 'Weather data unavailable';
  }
}

async function getBriefingData(address) {
  let weather = 'Weather data unavailable';
  let notams = 'NOTAMs not yet implemented';

  const location = await getLatLonFromAddress(address);
  if (location) {
    weather = await getMetarForLocation(location.lat, location.lon);
  }

  return {
    weather,
    notams
  };
}

module.exports = {
  getBriefingData
};
