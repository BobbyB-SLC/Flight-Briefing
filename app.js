require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getBriefingData } = require('./server/scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Needed to parse incoming JSON bodies


// ✅ Corrected this path (no /routes)
const leadsRoute = require('./leads');
app.use('/', leadsRoute);

app.post('/generate-pdf', async (req, res) => {
  const { location, datetime, drone, purpose, notes } = req.body;
  const doc = new PDFDocument();
  const filename = `Flight_Briefing_${Date.now()}.pdf`;
  const filepath = path.join(__dirname, 'output', filename);

  let weather = 'Weather data unavailable';
  let notams = 'NOTAMs not yet implemented';

  try {
    const briefing = await getBriefingData(location);
    weather = briefing.weather;
    notams = briefing.notams;
  } catch (err) {
    console.error('Error generating briefing data:', err.message);
  }

  doc.pipe(fs.createWriteStream(filepath));

  doc.fontSize(16).text('Flight Briefing - Preflight Review', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Location: ${location}`);
  doc.text(`Date & Time: ${datetime}`);
  doc.text(`Drone: ${drone}`);
  doc.text(`Purpose: ${purpose}`);
  doc.text(`Notes: ${notes || 'None'}`);
  doc.moveDown();
  doc.text('Airspace Classification: Class G (Uncontrolled)');
  doc.text(`NOTAMs/TFR: ${notams}`);
  doc.text(`Weather: ${weather}`);
  doc.text('Checklist: Batteries, props, firmware, IMU, SD card, RTH settings.');
  doc.text('LAANC: Not required in Class G.');
  doc.text('ND Filter: ND16 recommended for midday sun.');
  doc.end();

  doc.on('finish', () => {
    res.download(filepath, filename);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
