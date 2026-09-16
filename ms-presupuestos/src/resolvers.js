const { GraphQLError } = require('graphql');
const { presupuestosCollection } = require('./firebase');
const { numeroALetras } = require('./utils/numeroALetras');

function requiereAuth(context) {
  if (!context.usuario) {
    throw new GraphQLError('No autenticado', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.usuario;
}

// Calcula subtotal por fila, agrupa por categoría (partida) y el total
// general — igual que en el ejemplo real de presupuesto compartido.
function calcularPresupuesto(itemsInput) {
  const items = itemsInput.map((item) => ({
    itemId: item.itemId || null,
    descripcion: item.descripcion,
    categoria: item.categoria || 'Sin categoría',
    unidad: item.unidad,
    superficie: item.superficie,
    costoUnitario: item.costoUnitario,
    subtotal: Number((item.superficie * item.costoUnitario).toFixed(2)),
  }));

  const subtotalesPorCategoriaMap = {};
  for (const item of items) {
    subtotalesPorCategoriaMap[item.categoria] = (subtotalesPorCategoriaMap[item.categoria] || 0) + item.subtotal;
  }
  const subtotalesPorCategoria = Object.entries(subtotalesPorCategoriaMap).map(([categoria, subtotal]) => ({
    categoria,
    subtotal: Number(subtotal.toFixed(2)),
  }));

  const total = Number(items.reduce((suma, item) => suma + item.subtotal, 0).toFixed(2));

  return { items, subtotalesPorCategoria, total };
}

const resolvers = {
  Query: {
    misPresupuestos: async (_, __, context) => {
      const usuario = requiereAuth(context);
      const snapshot = await presupuestosCollection.where('usuarioId', '==', usuario.id).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },

    presupuesto: async (_, { id }, context) => {
      const usuario = requiereAuth(context);
      const docSnap = await presupuestosCollection.doc(id).get();

      if (!docSnap.exists) return null;
      const data = docSnap.data();
      if (data.usuarioId !== usuario.id) {
        throw new GraphQLError('No puedes ver un presupuesto de otro usuario', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return { id: docSnap.id, ...data };
    },
  },

  Mutation: {
    crearPresupuesto: async (_, { nombre, cliente, items }, context) => {
      const usuario = requiereAuth(context);

      const { items: itemsCalculados, subtotalesPorCategoria, total } = calcularPresupuesto(items);

      const nuevoPresupuesto = {
        usuarioId: usuario.id,
        nombre,
        cliente: cliente || null,
        items: itemsCalculados,
        subtotalesPorCategoria,
        total,
        totalEnLetras: numeroALetras(total),
        estado: 'borrador',
        fecha: new Date().toISOString(),
      };

      const docRef = await presupuestosCollection.add(nuevoPresupuesto);
      return { id: docRef.id, ...nuevoPresupuesto };
    },

    actualizarPresupuesto: async (_, { id, nombre, cliente, items }, context) => {
      const usuario = requiereAuth(context);
      const docRef = presupuestosCollection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new GraphQLError('Presupuesto no encontrado', { extensions: { code: 'NOT_FOUND' } });
      }
      const actual = docSnap.data();
      if (actual.usuarioId !== usuario.id) {
        throw new GraphQLError('No puedes editar un presupuesto de otro usuario', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const { items: itemsCalculados, subtotalesPorCategoria, total } = calcularPresupuesto(items);

      const cambios = {
        nombre: nombre || actual.nombre,
        cliente: cliente !== undefined ? cliente : actual.cliente,
        items: itemsCalculados,
        subtotalesPorCategoria,
        total,
        totalEnLetras: numeroALetras(total),
      };

      await docRef.update(cambios);
      return { id, ...actual, ...cambios };
    },

    eliminarPresupuesto: async (_, { id }, context) => {
      const usuario = requiereAuth(context);
      const docRef = presupuestosCollection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new GraphQLError('Presupuesto no encontrado', { extensions: { code: 'NOT_FOUND' } });
      }
      if (docSnap.data().usuarioId !== usuario.id) {
        throw new GraphQLError('No puedes eliminar un presupuesto de otro usuario', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await docRef.delete();
      return true;
    },

    actualizarEstado: async (_, { id, estado }, context) => {
      const usuario = requiereAuth(context);
      const docRef = presupuestosCollection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new GraphQLError('Presupuesto no encontrado', { extensions: { code: 'NOT_FOUND' } });
      }
      if (docSnap.data().usuarioId !== usuario.id) {
        throw new GraphQLError('No puedes modificar un presupuesto de otro usuario', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await docRef.update({ estado });
      return { id, ...docSnap.data(), estado };
    },
  },
};

module.exports = resolvers;
