import cors from 'cors';
import { D2 } from '@terrastruct/d2';
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.post('/generate-diagram', async (req, res) => {
  try {
    const d2Code = req.body.d2Code;
    if (!d2Code) {
      return res.status(400).json({ error: 'Missing d2Code in request body' });
    }
    const d2 = new D2();
    const result = await d2.compile(d2Code);
    const svg = await d2.render(result.diagram, result.renderOptions);

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/healthz', (req, res) => res.send('OK'));
app.listen(port, () => {
  console.log(D2 Render API listening at http://localhost:${port});
});
