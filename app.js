const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/generate-pdf', (req, res) => {
  const { location, datetime, drone, purpose, notes } = req.body;
  const doc = new PDFDocument();
  const filename = `Flight_Briefing_${Date.now()}.pdf`;
  const filepath = path.join(__dirname, 'output', filename);

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
  doc.text('NOTAMs/TFR: Placeholder - will scrape live data.');
  doc.text('Weather: Placeholder - will scrape METAR based on location.');
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
