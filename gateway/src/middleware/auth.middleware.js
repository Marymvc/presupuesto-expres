const jwt = require('jsonwebtoken');

// Este es el único lugar donde el JWT se valida "de cara al frontend":
// el Gateway es la puerta de entrada única, así que si el token no es
// válido, la petición ni siquiera llega a los microservicios internos.
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken };
