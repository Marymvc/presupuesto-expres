const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { usuariosCollection } = require('../firebase');

// POST /api/usuarios/registro
// Crea un usuario nuevo: User { id, nombre, email, passwordHash, rol }
async function registro(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
    }

    const existente = await usuariosCollection.where('email', '==', email).get();
    if (!existente.empty) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      nombre,
      email,
      passwordHash,
      rol: rol || 'cliente',
      creadoEn: new Date().toISOString(),
    };

    const docRef = await usuariosCollection.add(nuevoUsuario);

    return res.status(201).json({
      id: docRef.id,
      nombre,
      email,
      rol: nuevoUsuario.rol,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// POST /api/usuarios/login
// Verifica credenciales y devuelve el JWT
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const snapshot = await usuariosCollection.where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuarioDoc = snapshot.docs[0];
    const usuario = usuarioDoc.data();

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuarioDoc.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// GET /api/usuarios/me
// Perfil del usuario logueado (requiere JWT)
async function me(req, res) {
  try {
    const docSnap = await usuariosCollection.doc(req.usuario.id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { passwordHash, ...perfil } = docSnap.data();
    return res.json({ id: docSnap.id, ...perfil });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
}

module.exports = { registro, login, me };
