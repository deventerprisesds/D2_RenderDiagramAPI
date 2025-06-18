// Add form-data parsing
app.use(bodyParser.urlencoded({ extended: true }));

// Add the /render endpoint to match your curl
app.post('/render', async (req, res) => {
  try {
    const { title, text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text in request body' });
    }

    const inputFile = path.join(__dirname, 'diagram.d2');
    const outputFile = path.join(__dirname, 'diagram.png');
    
    // Use the text as D2 code
    fs.writeFileSync(inputFile, text);
    
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
