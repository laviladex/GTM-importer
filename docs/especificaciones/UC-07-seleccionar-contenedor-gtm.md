# UC-07: Seleccionar contenedor GTM

| Campo                   | Detalle                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-07                                                                                                                                                                                                                                    |
| **Nombre**              | Seleccionar contenedor GTM                                                                                                                                                                                                               |
| **Actor primario**      | Operador                                                                                                                                                                                                                                 |
| **Actores secundarios** | GTM API v2                                                                                                                                                                                                                               |
| **Precondiciones**      | El sistema dispone del `accountPath` de la cuenta GTM seleccionada ([UC-05](./UC-05-seleccionar-cuenta-gtm.md)).                                                                                                                         |
| **Postcondiciones**     | El sistema dispone del `containerPath` (ej.: `accounts/123/containers/456`) del contenedor GTM destino.                                                                                                                                  |
| **Descripción**         | El sistema consulta los contenedores disponibles dentro de la cuenta GTM seleccionada y presenta una lista al operador para que elija el contenedor destino de la importación. Si solo existe un contenedor, la selección es automática. |

---

## Flujo Principal

1. El sistema muestra en consola: `"Buscando contenedores para: <accountPath>..."`.
2. El sistema invoca **[UC-08 — Listar contenedores GTM](./UC-08-listar-contenedores-gtm.md)**.
3. El sistema muestra la cantidad de contenedores encontrados.
4. El sistema registra la cantidad en el log de sesión.

---

## Flujo Alternativo A — Un solo contenedor disponible

1. El sistema detecta que solo existe **un** contenedor.
2. El sistema asigna el `containerPath` del único contenedor (`container.path`).
3. El sistema muestra: `"Contenedor auto-seleccionado: <nombre> (<containerPath>)"` en color verde.
4. El sistema registra el evento `CONTAINER_AUTO_SELECTED` en el log.

## Flujo Alternativo B — Múltiples contenedores disponibles

1. El sistema muestra un prompt de selección tipo lista con los nombres de cada contenedor.
2. El operador navega con las teclas de flechas, selecciona un contenedor y presiona **Enter**.
3. El sistema asigna el `containerPath` del contenedor seleccionado.
4. El sistema registra el `containerPath` seleccionado en el log de sesión (`userInput: selectedContainerPath`).

---

## Excepciones

| Condición                                                 | Respuesta del sistema                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| No se encontraron contenedores en la cuenta seleccionada. | Muestra: `"✖ Sin contenedores disponibles en esta cuenta."` Registra advertencia en el log. La función `runImport()` retorna `false`. |
| El `containerPath` no puede ser determinado.              | Lanza error: `"No se pudo determinar el contenedor seleccionado."` Registra el error. Cancela la importación.                         |

---

## Casos de uso relacionados

- **Incluye:** [UC-08 — Listar contenedores GTM](./UC-08-listar-contenedores-gtm.md)
- **Precede a:** [UC-09 — Seleccionar workspace](./UC-09-seleccionar-workspace.md)
