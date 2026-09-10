require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken } = require('./middleware/auth.middleware');

const app = express();

app.use(cors());

// Límite básico para evitar abuso (ej. fuerza bruta en login)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // peticiones por IP en esa ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' },
});
app.use(limiter);

// IMPORTANTE: no usar express.json() antes de las rutas con proxy —
// consumiría el stream del body y el proxy reenviaría una petición vacía.

// --- µs-Usuarios ---------------------------------------------------
// Registro y login son públicos: nadie tiene JWT todavía en ese punto.
app.use(
  '/api/usuarios/registro',
  createProxyMiddleware({ target: process.env.USUARIOS_URL, changeOrigin: true })
);
app.use(
  '/api/usuarios/login',
  createProxyMiddleware({ target: process.env.USUARIOS_URL, changeOrigin: true })
);
// El resto de /api/usuarios (ej. /me) sí requiere JWT válido.
app.use(
  '/api/usuarios',
  verificarToken,
  createProxyMiddleware({ target: process.env.USUARIOS_URL, changeOrigin: true })
);

// --- µs-Items --------------------------------------------------------
app.use(
  '/api/items',
  verificarToken,
  createProxyMiddleware({ target: process.env.ITEMS_URL, changeOrigin: true })
);

// --- µs-Presupuestos (GraphQL) ---------------------------------------
app.use(
  '/graphql',
  verificarToken,
  createProxyMiddleware({ target: process.env.PRESUPUESTOS_URL, changeOrigin: true })
);

app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'gateway' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway corriendo en http://localhost:${PORT}`);
  console.log(`  → µs-Usuarios:     ${process.env.USUARIOS_URL}`);
  console.log(`  → µs-Items:        ${process.env.ITEMS_URL}`);
  console.log(`  → µs-Presupuestos: ${process.env.PRESUPUESTOS_URL}`);
});
