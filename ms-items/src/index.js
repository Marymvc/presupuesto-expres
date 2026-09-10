require('dotenv').config();
const express = require('express');
const cors = require('cors');
const itemsRoutes = require('./routes/items.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/items', itemsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'ms-items' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`µs-Items corriendo en http://localhost:${PORT}`);
});
