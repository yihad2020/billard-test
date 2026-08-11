# Requisitos finales del cliente

Implementados en esta versión del demo:

- Mesas de billar 1–8: **Bs. 30 por hora**.
- Cacho 1 y Cacho 2: **Bs. 10 por hora**, con temporizador y cálculo proporcional.
- Poker: **Bs. 20 por hora**, con temporizador y cálculo proporcional.
- Islas 1–8: cuentas de consumo sin temporizador.
- Una sesión de juego abierta puede **traspasarse a otra mesa libre del mismo tipo**.
  - El temporizador no se reinicia.
  - Se mantienen los consumos.
  - Se mantiene la tarifa tomada al abrir la sesión.
  - La mesa original queda libre de inmediato.
  - La mesa destino pasa a ocupada.
- Las mesas de billar mantienen la opción **Cortar tiempo → Isla** para continuar solamente con consumos.

La versión del estado demo cambió a `v5`, por lo que el navegador cargará el nuevo dataset automáticamente la primera vez que abra esta versión.
