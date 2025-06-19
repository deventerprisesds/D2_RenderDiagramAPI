import express from 'express';
import cors from 'cors';
import { D2 } from '@terrastruct/d2';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Smart engine selection function
function selectOptimalEngine(d2Code) {
  const code = d2Code.toLowerCase();
  
  const containers = (code.match(/\{[^}]*\}/g) || []).length;
  const connections = (code.match(/->/g) || []).length;
  const sqlTables = (code.match(/shape:\s*sql_table/g) || []).length;
  const classes = (code.match(/shape:\s*class/g) || []).length;
  
  const hasComplexContainers = code.includes('->') && containers > 2;
  const hasNestedContainers = /\{[^{}]*\{[^{}]*\}[^{}]*\}/.test(code);
  const hasSqlContent = sqlTables > 0 || code.includes('sql');
  const hasArchitectureKeywords = /server|client|database|api|service|microservice|container/.test(code);
  
  if (hasSqlContent || classes > 0) {
    return { engine: 'elk', reason: 'ELK handles SQL tables and class diagrams better' };
  }
  
  if (hasComplexContainers || hasNestedContainers) {
    return { engine: 'elk', reason: 'ELK has better container-to-container routing support' };
  }
  
  if (hasArchitectureKeywords && (containers > 3 || connections > 5)) {
    return { engine: 'elk', reason: 'ELK is better for complex software architecture' };
  }
  
  if (connections > 10 || containers > 5) {
    return { engine: 'elk', reason: 'ELK minimizes edge crossings in complex diagrams' };
  }
  
  return { engine: 'dagre', reason: 'Dagre is reliable for simple hierarchical diagrams' };
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

    // FIXED: Use the correct options format from official docs
    const options = {};
    if (theme) options.themeID = parseInt(theme);
    if (sketch) options.sketch = sketch;
    
    // Add layout engine to the D2 code itself (this is the proven method)
    const d2CodeWithLayout = `vars: { d2-config: { layout-engine: ${selectedEngine} } }\n${d2Code}`;

    const d2 = new D2();
    const result = await d2.compile(d2CodeWithLayout, options);
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
