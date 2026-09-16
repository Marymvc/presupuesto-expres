const { test } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../src/middleware/auth.middleware');

function crearRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('rechaza la petición si no hay token', () => {
  const req = { headers: {} };
  const res = crearRes();
  let siguienteLlamado = false;

  verificarToken(req, res, () => { siguienteLlamado = true; });

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(siguienteLlamado, false);
});

test('rechaza un token inválido o mal firmado', () => {
  process.env.JWT_SECRET = 'secreto-de-pruebas';
  const req = { headers: { authorization: 'Bearer esto-no-es-un-token-valido' } };
  const res = crearRes();
  let siguienteLlamado = false;

  verificarToken(req, res, () => { siguienteLlamado = true; });

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(siguienteLlamado, false);
});

test('acepta un token válido, decodifica el usuario y sigue', () => {
  process.env.JWT_SECRET = 'secreto-de-pruebas';
  const token = jwt.sign({ id: 'abc123', email: 'mary@test.com', rol: 'cliente' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = crearRes();
  let siguienteLlamado = false;

  verificarToken(req, res, () => { siguienteLlamado = true; });

  assert.strictEqual(siguienteLlamado, true);
  assert.strictEqual(req.usuario.id, 'abc123');
  assert.strictEqual(req.usuario.email, 'mary@test.com');
});
