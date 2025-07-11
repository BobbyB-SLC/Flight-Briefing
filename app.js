// ✅ Fully upgraded app.js using ES Modules and OpenAI v5+
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Configuration, OpenAIApi } from 'openai';
import leadsRoute from './leads.js';
import { getBriefingData } from './server/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', leadsRoute);

app.get('/', (req, res) => {
  res.send('✅ Sky Lens Carolina API is live');
});

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

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

app.post('/generateBriefing', async (req, res) => {
  const { location, datetime, drone, purpose, notes } = req.body;

  const prompt = `You are a professional drone operations assistant for a Part 107 certified pilot. Based on the following flight details, generate a complete preflight briefing including:
- Airspace classification
- NOTAMs/TFR concerns (if any)
- Weather and visibility forecast
- Drone readiness checklist
- Operational risks or local advisories
- Whether LAANC is required
- ND filter recommendation based on lighting conditions, time of day, and flight purpose

Flight Details:
- Location: ${location}
- Date & Time: ${datetime}
- Drone Model: ${drone}
- Purpose: ${purpose}
- Notes: ${notes || 'None'}

The output should be structured, professional, and formatted for a pilot preflight review.`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const briefingText = completion.data.choices[0].message.content;

    const doc = new PDFDocument();
    const filename = `flight-briefing-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, 'public', filename);
    const writeStream = fs.createWriteStream(filepath);

    doc.pipe(writeStream);

    const logoPath = path.join(__dirname, 'public', 'skylens_logo.jpg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { fit: [100, 100], align: 'center' });
    }

    doc.moveDown().fontSize(18).text('Sky Lens Carolina - Flight Briefing', {
      align: 'center',
      underline: true,
    });

    doc.moveDown().fontSize(12).text(briefingText, { align: 'left' });

    doc.end();

    writeStream.on('finish', () => {
      res.sendFile(filepath);
    });
  } catch (err) {
    console.error('GPT briefing error:', err);
    res.status(500).send('Failed to generate briefing.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
