const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Ensure logs directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

app.use(bodyParser.json());
app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'html');

// Serve React static files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

// Render fake checkout
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'index.html'));
// });

// Get attack logs
app.get('/api/logs', (req, res) => {
  try {
    const logPath = path.join(__dirname, 'logs', 'attacks.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      const logEntries = logs.split('\n')
        .filter(entry => entry.trim() !== '')
        .map(entry => {
          const match = entry.match(/\[(.*?)\] Suspicious activity from (.*?): (.*)/);
          if (match) {
            return {
              timestamp: match[1],
              ip: match[2],
              reason: match[3]
            };
          }
          return null;
        })
        .filter(entry => entry !== null);
      res.json(logEntries);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

// Handle suspicious behavior
app.post('/flag-suspicious', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const reason = req.body.reason;
  const timestamp = new Date().toISOString();

  const log = `[${timestamp}] Suspicious activity from ${ip}: ${reason}\n`;
  fs.appendFileSync('./logs/attacks.log', log);

  res.status(200).json({ status: 'Logged' });
});

// Get quick stats
app.get('/api/stats', (req, res) => {
  res.json({
    today: 12,
    week: 54,
    month: 210,
  });
});

// Get recent attempts
app.get('/api/recent-attempts', (req, res) => {
  res.json([
    { id: 1, time: '2 min ago', type: 'Scraper', ip: '192.168.1.10' },
    { id: 2, time: '10 min ago', type: 'Credential Stuffing', ip: '192.168.1.22' },
  ]);
});

// Scan Now
app.post('/api/scan', (req, res) => {
  res.json({ success: true, message: 'Scan started!' });
});

// Update Protection
app.post('/api/update-protection', (req, res) => {
  res.json({ success: true, message: 'Protection updated!' });
});

// Emergency Lockdown
app.post('/api/lockdown', (req, res) => {
  res.json({ success: true, message: 'Emergency Lockdown Activated!' });
});

// Fallback to React for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bot Defender running on http://localhost:${PORT}`);
});
