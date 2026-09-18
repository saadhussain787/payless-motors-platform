const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseReceipt } = require('./extractReceipt');
const { syncJournalEntry } = require('./syncQBO');

const PORT = 3000;

// Helper function to read the JSON body from incoming requests
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  // Add CORS headers in case they are needed for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve index.html on the root path
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, '../frontend/index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading admin.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  // POST /api/extract -> Parse Receipt
  if (req.method === 'POST' && req.url === '/api/extract') {
    try {
      const body = await parseJsonBody(req);
      const { imageData } = body;
      
      const result = parseReceipt(imageData || 'Placeholder data');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/sync -> Sync Journal Entry to QBO
  if (req.method === 'POST' && req.url === '/api/sync') {
    try {
      const body = await parseJsonBody(req);
      const { companyKey, journalPayload } = body;
      
      if (!companyKey || !journalPayload) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing companyKey or journalPayload in request body' }));
        return;
      }

      // Execute the mock sync function (logs to the console)
      syncJournalEntry(companyKey, journalPayload);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Sync initiated for ${companyKey}` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Financial Portal Server running at http://localhost:${PORT}/`);
  console.log(`- UI Interface: http://localhost:${PORT}/`);
  console.log(`- API Extract:  http://localhost:${PORT}/api/extract`);
  console.log(`- API Sync:     http://localhost:${PORT}/api/sync`);
});
