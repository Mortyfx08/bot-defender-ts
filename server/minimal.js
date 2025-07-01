const express = require('express');
const app = express();
app.get('/health', (_req, res) => {
  console.log('Minimal health check hit');
  res.status(200).json({ status: 'healthy' });
});
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server ready on 0.0.0.0:${PORT}`);
}); 