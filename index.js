import express from 'express';
import cors from 'cors';
import { D2 } from '@terrastruct/d2';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/generate-diagram', async (req, res) => {
  try {
    const { d2Code, layout, theme, sketch } = req.body;
    
    const options = {};
    if (layout) options.layout = layout;
    if (theme) options.themeID = parseInt(theme);
    if (sketch) options.sketch = sketch;

    const d2 = new D2();
    const result = await d2.compile(d2Code, options);
    const svg = await d2.render(result.diagram, result.renderOptions);
    
    // Convert SVG string to binary buffer (like the old PNG approach)
    const svgBuffer = Buffer.from(svg, 'utf8');
    
    // Send as binary data (like the old res.sendFile did)
    res.set('Content-Type', 'image/svg+xml');
    res.set('Content-Length', svgBuffer.length);
    res.end(svgBuffer); // This sends binary data instead of text
    
    //res.set('Content-Type', 'image/svg+xml');
    //res.send(svg);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/healthz', (req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`D2 Render API listening at http://localhost:${port}`);
});
