const express = require('express');
const { listar, crear, editar, eliminar } = require('../controllers/items.controller');
const { verificarToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Todas las rutas de ítems requieren estar logueado
router.use(verificarToken);

router.get('/', listar);
router.post('/', crear);
router.put('/:id', editar);
router.delete('/:id', eliminar);

module.exports = router;
