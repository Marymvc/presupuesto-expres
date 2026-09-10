const { itemsCollection } = require('../firebase');

// Item { id, nombre, costoUnitario, unidad, categoria, usuarioId }
// El campo "categoria" agrupa los ítems en partidas (ej. "M01 · Obra gruesa
// y fina - Terraza"), tal como en el ejemplo real de presupuesto compartido.

// GET /api/items
// Lista solo los ítems del usuario logueado
async function listar(req, res) {
  try {
    const snapshot = await itemsCollection.where('usuarioId', '==', req.usuario.id).get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al listar los ítems' });
  }
}

// POST /api/items
// Crea un ítem reutilizable en el catálogo del usuario
async function crear(req, res) {
  try {
    const { nombre, costoUnitario, unidad, categoria } = req.body;

    if (!nombre || costoUnitario === undefined || !unidad) {
      return res.status(400).json({ error: 'nombre, costoUnitario y unidad son obligatorios' });
    }

    const nuevoItem = {
      nombre,
      costoUnitario: Number(costoUnitario),
      unidad,
      categoria: categoria || 'Sin categoría',
      usuarioId: req.usuario.id,
      creadoEn: new Date().toISOString(),
    };

    const docRef = await itemsCollection.add(nuevoItem);
    return res.status(201).json({ id: docRef.id, ...nuevoItem });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al crear el ítem' });
  }
}

// PUT /api/items/:id
// Edita nombre, costo, unidad o categoría de un ítem propio
async function editar(req, res) {
  try {
    const { id } = req.params;
    const docRef = itemsCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    if (docSnap.data().usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes editar un ítem de otro usuario' });
    }

    const { nombre, costoUnitario, unidad, categoria } = req.body;
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (costoUnitario !== undefined) cambios.costoUnitario = Number(costoUnitario);
    if (unidad !== undefined) cambios.unidad = unidad;
    if (categoria !== undefined) cambios.categoria = categoria;

    await docRef.update(cambios);
    return res.json({ id, ...docSnap.data(), ...cambios });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al editar el ítem' });
  }
}

// DELETE /api/items/:id
// Elimina un ítem del catálogo propio
async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const docRef = itemsCollection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    if (docSnap.data().usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes eliminar un ítem de otro usuario' });
    }

    await docRef.delete();
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al eliminar el ítem' });
  }
}

module.exports = { listar, crear, editar, eliminar };
