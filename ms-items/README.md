# µs-Items — PresupuestoExpress

Microservicio REST del catálogo reutilizable de ítems (CRUD). Puerto por defecto: **3002**.

Cada ítem tiene: `nombre`, `costoUnitario`, `unidad`, `categoria` (la partida, ej. "M01 · Obra gruesa y fina - Terraza") y `usuarioId` (a qué usuario pertenece).

## 1. Instalar dependencias

```bash
cd ms-items
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

- `JWT_SECRET` debe ser **exactamente el mismo** que usaste en `ms-usuarios` (así los tokens que emite `ms-usuarios` son válidos aquí).
- `GOOGLE_APPLICATION_CREDENTIALS`: mismo `serviceAccountKey.json` del proyecto Firebase (cópialo a esta carpeta).

## 3. Ejecutar

```bash
npm run dev
```

Deberías ver: `µs-Items corriendo en http://localhost:3002`

## 4. Probar los endpoints

Primero necesitas un token — genera uno logueándote en `ms-usuarios` (`POST /api/usuarios/login`).

### Crear un ítem
```bash
curl -X POST http://localhost:3002/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"nombre":"Colocado de carpeta","costoUnitario":40,"unidad":"M2","categoria":"M01 · Obra gruesa y fina - Terraza"}'
```

### Listar tus ítems
```bash
curl http://localhost:3002/api/items \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Editar un ítem
```bash
curl -X PUT http://localhost:3002/api/items/ID_DEL_ITEM \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"costoUnitario":45}'
```

### Eliminar un ítem
```bash
curl -X DELETE http://localhost:3002/api/items/ID_DEL_ITEM \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Estructura

```
ms-items/
├── package.json
├── .env.example
├── src/
│   ├── index.js
│   ├── firebase.js
│   ├── routes/items.routes.js
│   ├── controllers/items.controller.js
│   └── middleware/auth.middleware.js
```

## Siguiente paso

Con `ms-usuarios` y `ms-items` funcionando, seguimos con **µs-Presupuestos** (GraphQL, puerto 3003) — el corazón del proyecto: arma presupuestos agregando filas de ítem + superficie, calcula subtotal por fila, agrupa por categoría/partida (con subtotal por partida, como en tu ejemplo real) y calcula el total general.
