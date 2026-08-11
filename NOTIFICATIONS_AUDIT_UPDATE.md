# Auditoría y notificaciones del administrador

## Auditoría
- Nueva ruta `/auditoria`, visible únicamente para administradores.
- Buscador por usuario, acción, producto, mesa o entidad.
- Filtros por acción, usuario y rango de fechas.
- Paginación de 10, 20 o 50 registros.
- Acciones sensibles resaltadas visualmente.
- Reportes conserva la auditoría dentro de las exportaciones Excel/PDF, pero la vista operativa se trasladó al módulo Auditoría.

## Notificaciones del demo
- Campana de notificaciones en el header del administrador.
- Alertas por apertura de mesa, ventas, traspasos, correcciones, caja, inventario y stock bajo.
- Estado leído/no leído y opción para marcar todo como leído.
- Permiso de notificaciones del navegador desde Control del propietario.
- Botón de prueba para demostrar el flujo de alertas.
- El service worker ya contiene manejadores `push` y `notificationclick` para la futura integración Web Push.

## Diferencia demo vs producción
El demo Vercel mantiene información en `localStorage`, por lo que distintos celulares no comparten datos. Las alertas del navegador funcionan con los eventos que existen en el mismo navegador.

Para alertas push reales entre el celular de un cajero y el celular del propietario se necesita:
1. Backend/base de datos central compartida.
2. Guardar la suscripción Push de cada administrador.
3. Web Push con VAPID desde el servidor cuando ocurra un evento.
4. Service worker para mostrar la notificación incluso con la app cerrada.

El cliente PWA ya queda preparado para recibir ese `push` cuando se conecte el backend real.
