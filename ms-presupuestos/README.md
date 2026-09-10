# µs-Presupuestos — PresupuestoExpress

Microservicio **GraphQL** (Apollo Server): arma presupuestos, calcula el subtotal por fila, agrupa por categoría/partida y calcula el total general — el corazón del proyecto. Puerto por defecto: **3003**.

## 1. Instalar dependencias

```bash
cd ms-presupuestos
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

- `JWT_SECRET`: el mismo que en `ms-usuarios` y `ms-items`.
- `GOOGLE_APPLICATION_CREDENTIALS`: el mismo `serviceAccountKey.json` (cópialo a esta carpeta).

## 3. Ejecutar

```bash
npm run dev
```

Deberías ver: `µs-Presupuestos (GraphQL) corriendo en http://localhost:3003/graphql`

Abre esa URL en el navegador para usar el explorador de Apollo (Apollo Sandbox) y probar las queries visualmente.

## 4. Probar con curl

Primero necesitas un token (login en `ms-usuarios`).

### Crear un presupuesto (mutation)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "query": "mutation Crear($nombre: String!, $items: [ItemInput!]!) { crearPresupuesto(nombre: $nombre, items: $items) { id total totalEnLetras subtotalesPorCategoria { categoria subtotal } items { descripcion subtotal } } }",
    "variables": {
      "nombre": "Remodelación Multifamiliar",
      "items": [
        { "descripcion": "Colocado de carpeta", "categoria": "M01 · Obra gruesa y fina - Terraza", "unidad": "M2", "superficie": 131.99, "costoUnitario": 40 },
        { "descripcion": "Colocado de ceramica", "categoria": "M01 · Obra gruesa y fina - Terraza", "unidad": "M2", "superficie": 131.99, "costoUnitario": 25 }
      ]
    }
  }'
```

Esto responde con el `subtotal` calculado por fila, el `subtotal` agrupado por `categoria` y el `total` general — igual que en tu ejemplo de presupuesto real.

### Listar mis presupuestos (query)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"query": "query { misPresupuestos { id nombre total estado fecha } }"}'
```

### Cambiar el estado (mutation)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "query": "mutation($id: ID!, $estado: String!) { actualizarEstado(id: $id, estado: $estado) { id estado } }",
    "variables": { "id": "ID_DEL_PRESUPUESTO", "estado": "aprobado" }
  }'
```

## Qué calcula automáticamente

- **Subtotal por fila**: `superficie × costoUnitario`
- **Subtotal por partida**: suma de las filas que comparten `categoria`
- **Total general**: suma de todos los subtotales
- **Total en letras**: función propia (`src/utils/numeroALetras.js`) que convierte el monto a texto, igual que el pie "Son: Cuarenta y tres mil..." de un presupuesto real

## Estructura

```
ms-presupuestos/
├── package.json
├── .env.example
├── src/
│   ├── index.js              # Apollo Server + Express, extrae el usuario del JWT
│   ├── schema.js             # tipos, queries y mutations GraphQL
│   ├── resolvers.js          # lógica: cálculo de subtotales y total
│   ├── firebase.js           # conexión a Firestore
│   └── utils/numeroALetras.js
```

## Siguiente paso

Con los 3 microservicios listos, sigue el **Gateway** (puerto 3000): centraliza el acceso, valida el JWT una sola vez y reenvía cada petición al microservicio correspondiente — así el frontend nunca habla directo con µs-Usuarios, µs-Items o µs-Presupuestos.
