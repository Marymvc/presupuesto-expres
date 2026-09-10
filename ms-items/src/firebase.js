const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(require(credPath)),
  });
}

const db = admin.firestore();

// Colección independiente para este microservicio.
const itemsCollection = db.collection('items');

module.exports = { db, itemsCollection };
