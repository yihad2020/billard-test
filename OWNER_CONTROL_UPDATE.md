# Actualización final — control del propietario y seguridad operativa

Esta versión incorpora el último feedback del cliente:

- Las **Islas 1–8** siguen siendo cuentas separadas de consumo **sin temporizador**.
- Nueva pantalla **Control** exclusiva para administradores, pensada para celular.
- Desde Control se visualizan cuentas abiertas, mesas ocupadas, islas abiertas, productos cargados, cajero responsable, tiempos, totales abiertos, cajas activas y stock bajo.
- Se muestra actividad sensible para facilitar supervisión y trazabilidad.
- Al quitar un producto de una cuenta ahora es **obligatorio indicar un motivo**; la corrección queda auditada.
- Inventario, precios, usuarios y reportes continúan restringidos a administradores.
- Se agregó configuración **PWA** para instalar el demo desde el navegador en la pantalla de inicio del celular.
- El demo usa `localStorage`; por lo tanto cada dispositivo mantiene su propio estado. La sincronización real entre celulares/cajeros se obtiene al volver a conectar el frontend al backend PHP + MySQL de producción.

## Tarifas vigentes

- Billar 1–8: Bs. 30/hora
- Cacho 1–2: Bs. 10/hora
- Poker: Bs. 20/hora
- Islas 1–8: sin cobro de tiempo
