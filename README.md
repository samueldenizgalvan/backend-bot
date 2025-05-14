# Bot WhatsApp Backend

Este es el backend Node.js para gestionar bots de WhatsApp multiusuario y la API de tu sistema de citas.

## Estructura
- `server.js`: Entrada principal del backend.
- `/routes`: Rutas de la API (autenticación, soporte, citas).
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
   node server.js
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
