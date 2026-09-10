# µs-Usuarios — PresupuestoExpress

Microservicio REST de usuarios: registro, login (JWT) y perfil. Puerto por defecto: **3001**.

## 1. Instalar dependencias

```bash
cd ms-usuarios
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `.env` con:
- `JWT_SECRET`: cualquier cadena larga y aleatoria.
- `GOOGLE_APPLICATION_CREDENTIALS`: ruta al JSON de tu cuenta de servicio de Firebase.

### Obtener el JSON de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com) → tu proyecto.
2. **Configuración del proyecto** (ícono de engranaje) → **Cuentas de servicio**.
3. Clic en **Generar nueva clave privada** → se descarga un `.json`.
4. Guárdalo como `ms-usuarios/serviceAccountKey.json` (o donde prefieras, ajustando la ruta en `.env`).
5. **Nunca subas ese archivo a git** — agrégalo a `.gitignore`.

## 3. Ejecutar

```bash
npm run dev
```

Deberías ver: `µs-Usuarios corriendo en http://localhost:3001`

## 4. Probar los endpoints

### Registro
```bash
curl -X POST http://localhost:3001/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mary Villca","email":"mary@test.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mary@test.com","password":"123456"}'
```
Copia el `token` que devuelve.

### Perfil (requiere el token)
```bash
curl http://localhost:3001/api/usuarios/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Estructura

```
ms-usuarios/
├── package.json
├── .env.example
├── src/
│   ├── index.js                     # arranca el servidor Express
│   ├── firebase.js                  # conexión a Firestore
│   ├── routes/usuarios.routes.js    # define las 3 rutas
│   ├── controllers/usuarios.controller.js  # lógica de negocio
│   └── middleware/auth.middleware.js       # valida el JWT
```

## Siguiente paso

Cuando este microservicio te funcione, seguimos con **µs-Items** (catálogo reutilizable, puerto 3002), tal como indica el orden recomendado de construcción en la diapositiva 9.
