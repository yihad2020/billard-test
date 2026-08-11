# Seguridad para la versión de producción

El demo de Vercel funciona sin backend y guarda datos en `localStorage`. Esto sirve para enseñar el flujo y la interfaz, pero **no debe usarse como sistema real de caja/inventario**.

Cuando el backend PHP + MySQL vuelva a estar disponible, la versión de producción debe mantener estas reglas:

1. **Fuente de verdad en MySQL**: ventas, mesas, inventario, caja y auditoría se guardan en servidor, nunca solamente en el navegador.
2. **Autenticación segura**: contraseñas con `password_hash/password_verify`, tokens de sesión aleatorios y expiración.
3. **Permisos verificados por PHP**: cajeros no pueden cambiar precios, stock, usuarios ni reportes administrativos aunque intenten llamar la API directamente.
4. **Auditoría append-only**: aperturas/cierres, traspasos, eliminaciones de consumos, ajustes de stock, caja y cambios de precio registran usuario, fecha, motivo y valores relevantes.
5. **Correcciones con motivo**: retirar un consumo requiere motivo; idealmente puede configurarse aprobación de administrador para anulaciones sensibles.
6. **Transacciones MySQL**: cobro, venta, inventario, caja y cierre de mesa deben confirmarse o revertirse como una sola operación.
7. **Sin borrado físico de ventas**: usar estados/anulaciones auditadas en vez de `DELETE` para operaciones económicas.
8. **HTTPS y secretos fuera del repositorio**: credenciales de MySQL y claves sólo en `.env` del servidor.
9. **Backups automáticos**: respaldo diario de MySQL con retención y prueba periódica de restauración.
10. **Control multidispositivo**: la pantalla `Control` consulta el backend central para que propietario y trabajadores compartan el mismo estado desde celular y computadora.
