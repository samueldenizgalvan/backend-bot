# Bot WhatsApp Backend

Este es el backend Node.js para gestionar bots de WhatsApp multiusuario y la API de tu sistema de citas.

## Estructura
- `server.js`: Entrada principal del backend.
- `/routes`: Rutas de la API (autenticación, citas).
- `/controllers`: Lógica de cada endpoint.
- `/services`: Servicios de negocio (WhatsApp, email, etc).
- `/config`: Configuración de servicios.

## Instalación
1. Clona el repositorio:
   ```sh
   git clone <TU_REPO_GITHUB>
   cd backend
   ```
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Configura tu entorno si usas `.env` (opcional).
4. Ejecuta el servidor:
   ```sh
   npm run start:api
   ```

## Uso con PM2
Lanza la API y los bots como procesos administrados por [PM2](https://pm2.keymetrics.io/):

- Inicia la API:
  ```sh
  npm run pm2:api
  ```

- Inicia un bot para un tenant específico (reemplaza `123` por tu TENANT_ID):
  ```sh
  TENANT_ID=123 npm run pm2:bot
  ```

## Notas
- No subas `node_modules`, `.wwebjs_auth`, `.env` ni archivos de sesión a GitHub.
- Cada usuario autenticado puede tener su propio bot de WhatsApp.
- Las sesiones de WhatsApp se almacenan en `.wwebjs_auth/` (una carpeta por usuario).

## Seguridad
- Cambia las contraseñas y secretos antes de producción.
- Usa HTTPS en producción.

---
Hecho por Samuel Déniz
