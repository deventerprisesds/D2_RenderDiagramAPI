const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/generate-diagram', async (req, res) => {
  try {
    const d2Code = req.body.d2Code;
    if (!d2Code) {
      return res.status(400).json({ error: 'Missing d2Code in request body' });
    }

    const inputFile = path.join(__dirname, 'diagram.d2');
    const outputFile = path.join(__dirname, 'diagram.png');

    fs.writeFileSync(inputFile, d2Code);

    exec(`d2 ${inputFile} ${outputFile}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error generating diagram:', stderr);
        return res.status(500).json({ error: 'Failed to generate diagram' });
      }

      res.sendFile(outputFile);
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/healthz', (req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`D2 Render API listening at http://localhost:${port}`);
});
