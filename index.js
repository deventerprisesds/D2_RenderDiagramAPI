import express from 'express';
import cors from 'cors';
import { D2 } from '@terrastruct/d2';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Smart engine selection function
function selectOptimalEngine(d2Code) {
  // ... (engine selection logic above)
}

app.post('/generate-diagram', async (req, res) => {
  try {
    const { d2Code, layout, theme, sketch, autoEngine = true } = req.body;
    
    if (!d2Code) {
      return res.status(400).json({ error: 'Missing d2Code in request body' });
    }

    // Smart engine selection
    let selectedEngine = layout || 'dagre';
    let engineReason = 'User specified';
    
    if (autoEngine && !layout) {
      const selection = selectOptimalEngine(d2Code);
      selectedEngine = selection.engine;
      engineReason = selection.reason;
    }
    
    const options = { layout: selectedEngine };
    if (theme) options.themeID = parseInt(theme);
    if (sketch) options.sketch = sketch;
    
    const d2 = new D2();
    const result = await d2.compile(d2Code, options);
    const svg = await d2.render(result.diagram, result.renderOptions);
    
    const svgBuffer = Buffer.from(svg, 'utf8');
    res.set('Content-Type', 'image/svg+xml');
    res.set('X-D2-Engine', selectedEngine);
    res.set('X-D2-Engine-Reason', engineReason);
    res.set('Content-Length', svgBuffer.length);
    res.end(svgBuffer);
    
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/healthz', (req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`D2 Render API listening at http://localhost:${port}`);
});
