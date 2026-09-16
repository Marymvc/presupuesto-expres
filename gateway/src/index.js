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

// Express recorta el "mount path" antes de pasarle la petición al proxy
// (ej. montado en /api/usuarios/login, req.url llegaría como "/").
// pathRewrite reconstruye la ruta completa original con req.originalUrl,
// para que el microservicio reciba la misma ruta que pidió el frontend.
function proxyHacia(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
  });
}

// --- µs-Usuarios ---------------------------------------------------
// Registro y login son públicos: nadie tiene JWT todavía en ese punto.
app.use('/api/usuarios/registro', proxyHacia(process.env.USUARIOS_URL));
app.use('/api/usuarios/login', proxyHacia(process.env.USUARIOS_URL));
// El resto de /api/usuarios (ej. /me) sí requiere JWT válido.
app.use('/api/usuarios', verificarToken, proxyHacia(process.env.USUARIOS_URL));

// --- µs-Items --------------------------------------------------------
app.use('/api/items', verificarToken, proxyHacia(process.env.ITEMS_URL));

// --- µs-Presupuestos (GraphQL) ---------------------------------------
app.use('/graphql', verificarToken, proxyHacia(process.env.PRESUPUESTOS_URL));

app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'gateway' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway corriendo en http://localhost:${PORT}`);
  console.log(`  → µs-Usuarios:     ${process.env.USUARIOS_URL}`);
  console.log(`  → µs-Items:        ${process.env.ITEMS_URL}`);
  console.log(`  → µs-Presupuestos: ${process.env.PRESUPUESTOS_URL}`);
});
