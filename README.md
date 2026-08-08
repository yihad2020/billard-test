# Billar Control — Demo Vercel

Versión de demostración del sistema Billar Control preparada para desplegarse como una SPA de React/Vite en Vercel **sin depender de PHP ni MySQL**.

Esta versión existe únicamente para mostrar el flujo completo al cliente mientras el hosting PHP se normaliza. Los cambios de mesas, inventario, caja, ventas y usuarios se guardan en `localStorage` del navegador que está usando la demo.

## Credenciales demo

**Administrador**
- Usuario: `admin`
- Contraseña: `admin123`

**Cajero**
- Usuario: `caja`
- Contraseña: `caja123`

También existe un cajero adicional `maria / demo123`.

## Funciones activas en la demo

- Login con rol Administrador / Cajero
- Dashboard con métricas y ventas realistas
- Plano gráfico e interactivo del salón
- Abrir y cerrar mesas
- Temporizador y cobro por hora
- Cacho/Poker con cobro manual
- Agregar/quitar consumos por mesa
- Descuento automático de inventario
- Venta rápida POS
- Apertura, movimientos y cierre de caja
- Gestión de inventario y productos
- Gestión de usuarios
- Reportes por fechas
- Exportación Excel y PDF
- Auditoría de acciones
- Reacomodo del mapa por drag & drop para administradores

## Desarrollo local

```bash
npm install
npm run dev
```

Luego abre la URL que muestre Vite, normalmente `http://localhost:5173`.

## Build local

```bash
npm run build
```

Vite genera `dist/`.

## Desplegar en Vercel desde GitHub

1. Crea un repositorio privado en GitHub.
2. Sube **el contenido de esta carpeta** como raíz del repositorio.
3. En Vercel, selecciona **Add New → Project**.
4. Importa el repositorio.
5. Vercel debería detectar **Vite** automáticamente.
6. Verifica:
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. No necesitas crear base de datos ni configurar PHP para esta demo.
8. Presiona **Deploy**.

El archivo `vercel.json` ya incluye el rewrite necesario para React Router, de modo que rutas como `/mesas`, `/inventario` y `/reportes` funcionen también al refrescar la página.

## Datos demo

La primera visita crea información ficticia realista: productos, mesas, cajas, ventas, auditoría y sesiones abiertas.

Cada navegador tiene su propia copia. Los cambios persisten en ese navegador usando `localStorage`.

En la pantalla de login puedes usar **Restablecer demo** para volver al estado inicial.

## Importante

Esta variante no debe utilizarse como sistema de producción. No hay una base de datos central ni seguridad de servidor: el objetivo es demostrar la experiencia completa y los flujos de la aplicación. Cuando el hosting PHP vuelva a funcionar, utiliza la versión PHP + MySQL para operación real.
