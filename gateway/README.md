# Gateway — PresupuestoExpress

Punto único de entrada para el frontend. Valida el JWT y reenvía cada petición al microservicio correspondiente. Puerto por defecto: **3000**.

```
Frontend → Gateway :3000 → µs-Usuarios :3001 (REST)
                          → µs-Items :3002 (REST)
                          → µs-Presupuestos :3003 (GraphQL)
```

El frontend **nunca** habla directo con los microservicios — todo pasa por aquí.

## 1. Instalar dependencias

```bash
cd gateway
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

`JWT_SECRET` debe ser **exactamente el mismo** en los 4 servicios (Gateway, ms-usuarios, ms-items, ms-presupuestos). Las URLs (`USUARIOS_URL`, `ITEMS_URL`, `PRESUPUESTOS_URL`) ya vienen con los puertos por defecto.

## 3. Levantar TODO el sistema (4 terminales)

```bash
# Terminal 1
cd ms-usuarios && npm run dev

# Terminal 2
cd ms-items && npm run dev

# Terminal 3
cd ms-presupuestos && npm run dev

# Terminal 4
cd gateway && npm run dev
```

## 4. Probar el flujo completo A TRAVÉS del Gateway

A partir de ahora, **todo apunta al puerto 3000**, no a 3001/3002/3003 directamente.

### Registro
```bash
curl -X POST http://localhost:3000/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mary Villca","email":"mary@test.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mary@test.com","password":"123456"}'
```

### Perfil (requiere token, el Gateway lo valida antes de reenviar)
```bash
curl http://localhost:3000/api/usuarios/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Crear un ítem
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"nombre":"Colocado de carpeta","costoUnitario":40,"unidad":"M2","categoria":"M01 · Obra gruesa y fina - Terraza"}'
```

### Crear un presupuesto (GraphQL)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "query": "mutation($nombre: String!, $items: [ItemInput!]!) { crearPresupuesto(nombre: $nombre, items: $items) { id total totalEnLetras } }",
    "variables": {
      "nombre": "Remodelación Multifamiliar",
      "items": [{ "descripcion": "Colocado de carpeta", "categoria": "M01", "unidad": "M2", "superficie": 131.99, "costoUnitario": 40 }]
    }
  }'
```

### Verificar que el Gateway SÍ bloquea sin token
```bash
curl http://localhost:3000/api/items
# → 401 {"error":"Token no proporcionado"}
```

## Qué hace el Gateway

- **Rutas públicas** (sin JWT): `POST /api/usuarios/registro`, `POST /api/usuarios/login`
- **Rutas protegidas** (requieren JWT válido): todo lo demás — `/api/usuarios/me`, `/api/items/*`, `/graphql`
- **Rate limiting**: máx. 300 peticiones por IP cada 15 minutos, para mitigar abuso (ej. fuerza bruta en login)
- **Reenvío transparente**: usa `http-proxy-middleware`, así que la ruta que llama el frontend es la misma que expone cada microservicio

## Estructura

```
gateway/
├── package.json
├── .env.example
├── src/
│   ├── index.js                    # define las rutas proxy y el rate limit
│   └── middleware/auth.middleware.js  # valida el JWT antes de reenviar
```

## Siguiente paso

Con los 4 servicios corriendo y hablando entre sí, sigue el **Frontend** (HTML + CSS + JS, `fetch` hacia `http://localhost:3000`) y después **CI/CD** (GitHub Actions: push a main → tests → build → deploy).
