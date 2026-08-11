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
- Cacho 1 y Cacho 2 con temporizador a **Bs. 10/hora**
- Poker con temporizador a **Bs. 20/hora**
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


## Actualización de cliente — Islas y tarifa de billar

- Las mesas de billar 1–8 tienen tarifa demo de **Bs. 30 por hora**.
- Cada mesa de billar tiene una **isla de consumo** asociada.
- Las islas pueden abrir cuentas de consumo sin cobrar tiempo.
- Desde una mesa de billar ocupada se puede usar **“Cortar tiempo → Isla”**. El importe de juego se congela en ese instante, la mesa de billar queda libre y la cuenta continúa en su isla con todos los consumos existentes.
- Cacho 1 y Cacho 2 están configuradas a **Bs. 10 por hora**.
- Poker está configurada a **Bs. 20 por hora**.
- Las sesiones de juego pueden **traspasarse a otra mesa libre del mismo tipo** sin reiniciar el tiempo ni perder los consumos.
- Esta actualización cambia el esquema de datos demo a v4, por lo que el navegador iniciará con datos demo nuevos después del despliegue.

## Último feedback del cliente: control desde celular

La versión 1.3 agrega una vista administrativa **Control** optimizada para móvil. Permite revisar cuentas abiertas, mesas/islas activas, productos cargados, cajero responsable, total en curso, cajas abiertas, stock bajo y actividad sensible.

También se agregó soporte PWA para que el demo pueda instalarse desde el navegador como una app en la pantalla de inicio.

> Nota de demo: el modo Vercel sigue usando `localStorage`, así que distintos dispositivos no comparten el mismo estado. En producción, la misma interfaz se conecta al backend PHP + MySQL y ahí sí permite supervisión multiusuario/multidispositivo en tiempo real.
