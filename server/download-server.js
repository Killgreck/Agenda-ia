// Simple Express server to serve static download files
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Specific route for download page
app.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'download.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Download server running at http://0.0.0.0:${PORT}/download`);
  console.log(`Direct archive download: http://0.0.0.0:${PORT}/agenda-ia-project.tar.gz`);
});