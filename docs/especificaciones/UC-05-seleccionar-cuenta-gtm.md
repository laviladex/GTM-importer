# UC-05: Seleccionar cuenta GTM

| Campo                   | Detalle                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-05                                                                                                                                                                                                         |
| **Nombre**              | Seleccionar cuenta GTM                                                                                                                                                                                        |
| **Actor primario**      | Operador                                                                                                                                                                                                      |
| **Actores secundarios** | GTM API v2                                                                                                                                                                                                    |
| **Precondiciones**      | El archivo `container.json` fue cargado exitosamente ([UC-04](./UC-04-seleccionar-container-json.md)). El cliente de autenticación está disponible.                                                           |
| **Postcondiciones**     | El sistema dispone del `accountPath` (ej.: `accounts/123456`) de la cuenta GTM destino.                                                                                                                       |
| **Descripción**         | El sistema consulta las cuentas de GTM accesibles con las credenciales provistas y presenta una lista al operador para que seleccione a cuál importar. Si solo existe una cuenta, la selección es automática. |

---

## Flujo Principal

1. El sistema muestra en consola: `"Buscando cuentas de GTM..."`.
2. El sistema invoca **[UC-06 — Listar cuentas GTM](./UC-06-listar-cuentas-gtm.md)** para obtener el listado de cuentas.
3. El sistema muestra la cantidad de cuentas encontradas.
4. El sistema registra la cantidad de cuentas en el log de sesión.

---

## Flujo Alternativo A — Una sola cuenta disponible

1. El sistema detecta que solo existe **una** cuenta.
2. El sistema construye el `accountPath` con el campo `path` de la cuenta o, si no existe, con `accounts/<accountId>`.
3. El sistema muestra: `"Cuenta auto-seleccionada: <nombre> (<accountPath>)"` en color verde.
4. El sistema registra el evento `ACCOUNT_AUTO_SELECTED` en el log.

## Flujo Alternativo B — Múltiples cuentas disponibles

1. El sistema muestra un prompt de selección tipo lista con los nombres de cada cuenta.
2. El operador navega con las teclas de flechas, selecciona una cuenta y presiona **Enter**.
3. El sistema asigna el `accountPath` de la cuenta seleccionada.
4. El sistema registra el `accountPath` seleccionado en el log de sesión (`userInput: selectedAccountPath`).

---

## Excepciones

| Condición                                                                              | Respuesta del sistema                                                                                                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| No se encontraron cuentas asociadas a las credenciales.                                | Muestra: `"✖ Sin cuentas disponibles para estas credenciales."` Registra advertencia en el log. La función `runImport()` retorna `false`. |
| El `accountPath` no puede ser determinado (campo `path` y `accountId` ambos ausentes). | Lanza error: `"No se pudo determinar la cuenta seleccionada."` Registra el error. Cancela la importación.                                 |

---

## Casos de uso relacionados

- **Incluye:** [UC-06 — Listar cuentas GTM](./UC-06-listar-cuentas-gtm.md)
- **Precede a:** [UC-07 — Seleccionar contenedor GTM](./UC-07-seleccionar-contenedor-gtm.md)
