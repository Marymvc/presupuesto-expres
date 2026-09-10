const admin = require('firebase-admin');
const path = require('path');

// Inicializa Firebase Admin usando el archivo de credenciales indicado
// en GOOGLE_APPLICATION_CREDENTIALS (ver .env.example).
if (!admin.apps.length) {
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(require(credPath)),
  });
}

const db = admin.firestore();

// Colección independiente para este microservicio, tal como indica
// la arquitectura: "Colección independiente por microservicio".
const usuariosCollection = db.collection('usuarios');

module.exports = { db, usuariosCollection };
