require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function main() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      // Extrae el usuario del JWT (igual que el middleware REST de los
      // otros microservicios) y lo pone disponible para los resolvers.
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return { usuario: null };
        }
        try {
          const token = authHeader.split(' ')[1];
          const usuario = jwt.verify(token, process.env.JWT_SECRET);
          return { usuario };
        } catch (err) {
          return { usuario: null };
        }
      },
    })
  );

  app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'ms-presupuestos' }));

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`µs-Presupuestos (GraphQL) corriendo en http://localhost:${PORT}/graphql`);
  });
}

main();
