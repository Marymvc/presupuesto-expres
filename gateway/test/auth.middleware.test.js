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

test('deja pasar un token válido antes de reenviar al microservicio', () => {
  // El Gateway solo valida el JWT y reenvía — cada microservicio decodifica
  // el usuario por su cuenta, así que aquí solo comprobamos que next() se
  // llama cuando el token es válido.
  process.env.JWT_SECRET = 'secreto-de-pruebas';
  const token = jwt.sign({ id: 'abc123', email: 'mary@test.com', rol: 'cliente' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = crearRes();
  let siguienteLlamado = false;

  verificarToken(req, res, () => { siguienteLlamado = true; });

  assert.strictEqual(siguienteLlamado, true);
  assert.strictEqual(res.statusCode, null);
});
