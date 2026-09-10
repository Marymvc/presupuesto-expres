const { gql } = require('graphql-tag');

const typeDefs = gql`
  type ItemPresupuesto {
    descripcion: String!
    categoria: String!
    unidad: String!
    superficie: Float!
    costoUnitario: Float!
    subtotal: Float!
  }

  type SubtotalCategoria {
    categoria: String!
    subtotal: Float!
  }

  type Presupuesto {
    id: ID!
    usuarioId: String!
    nombre: String!
    items: [ItemPresupuesto!]!
    subtotalesPorCategoria: [SubtotalCategoria!]!
    total: Float!
    totalEnLetras: String!
    estado: String!
    fecha: String!
  }

  input ItemInput {
    descripcion: String!
    categoria: String
    unidad: String!
    superficie: Float!
    costoUnitario: Float!
  }

  type Query {
    "Lista los presupuestos del usuario logueado"
    misPresupuestos: [Presupuesto!]!
    "Obtiene un presupuesto por id (solo si es del usuario logueado)"
    presupuesto(id: ID!): Presupuesto
  }

  type Mutation {
    "Crea un presupuesto: calcula subtotal por fila, agrupa por categoría y calcula el total"
    crearPresupuesto(nombre: String!, items: [ItemInput!]!): Presupuesto!
    "Cambia el estado del presupuesto (ej. borrador -> aprobado)"
    actualizarEstado(id: ID!, estado: String!): Presupuesto!
  }
`;

module.exports = typeDefs;
