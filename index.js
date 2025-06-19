import express from 'express';
import cors from 'cors';
import { D2 } from '@terrastruct/d2';
import sharp from 'sharp';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/generate-diagram', async (req, res) => {
  try {
    const { d2Code, title, layout_engine, theme, output_format } = req.body;
    
    if (!d2Code) {
      return res.status(400).json({ error: 'Missing d2Code in request body' });
    }

    console.log('Generating diagram with D2 code:', d2Code);
    console.log('Requested format:', output_format || 'svg');

    const d2 = new D2();
    const result = await d2.compile(d2Code);
    const svg = await d2.render(result.diagram, result.renderOptions);
    
    // Check if PNG output is requested
    if (output_format === 'png') {
      console.log('Converting SVG to PNG...');
      
      try {
        // Convert SVG to PNG using Sharp
        const pngBuffer = await sharp(Buffer.from(svg))
          .png()
          .toBuffer();
        
        console.log('PNG generated successfully:', pngBuffer.length, 'bytes');
        
        res.set('Content-Type', 'image/png');
        res.send(pngBuffer);
        
      } catch (conversionError) {
        console.error('SVG to PNG conversion failed:', conversionError);
        
        // Fallback to SVG if conversion fails
        console.log('Falling back to SVG output');
        res.set('Content-Type', 'image/svg+xml');
        res.send(svg);
      }
      
    } else {
      // Return SVG (default)
      console.log('Returning SVG output');
      res.set('Content-Type', 'image/svg+xml');
      res.send(svg);
    }
    
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.get('/healthz', (req, res) => res.send('OK'));

app.listen(port, () =>
