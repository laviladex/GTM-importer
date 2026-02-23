# Especificaciones de Casos de Uso — GTM Importer

## Índice

| ID    | Nombre                              |
| ----- | ----------------------------------- |
| UC-01 | Autenticar con Google               |
| UC-02 | Seleccionar archivo de credenciales |
| UC-03 | Obtener token OAuth2                |
| UC-04 | Seleccionar archivo container.json  |
| UC-05 | Seleccionar cuenta GTM              |
| UC-06 | Listar cuentas GTM                  |
| UC-07 | Seleccionar contenedor GTM          |
| UC-08 | Listar contenedores GTM             |
| UC-09 | Seleccionar workspace               |
| UC-10 | Crear nuevo workspace               |
| UC-11 | Obtener workspace existente         |
| UC-12 | Configurar modo de importación      |
| UC-13 | Analizar diferencias (Diff)         |
| UC-14 | Ver detalle de conflictos           |
| UC-15 | Confirmar importación               |
| UC-16 | Ejecutar importación                |
| UC-17 | Registrar log de sesión             |
| UC-18 | Reiniciar proceso                   |

---

## UC-01: Autenticar con Google

| Campo                   | Detalle                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-01                                                                                                                   |
| **Nombre**              | Autenticar con Google                                                                                                   |
| **Actor primario**      | GTM Importer (sistema)                                                                                                  |
| **Actores secundarios** | Google OAuth 2.0 / Service Account                                                                                      |
| **Precondiciones**      | El archivo de credenciales fue localizado y leído (UC-02).                                                              |
| **Postcondiciones**     | El sistema obtiene un cliente de autenticación (`auth`) válido con los scopes de GTM habilitados.                       |
| **Descripción**         | El sistema detecta el tipo de credencial (Service Account u OAuth2) y aplica el flujo de autenticación correspondiente. |

**Flujo Principal (Service Account):**

1. El sistema lee el campo `type` del archivo de credenciales.
2. Detecta que es `service_account`.
3. Crea el cliente de autenticación usando `google.auth.fromJSON()`.
4. Asigna los scopes de edición de GTM.
5. Retorna el cliente autenticado.

**Flujo Alternativo (OAuth2):**

1. El sistema detecta que el tipo es `oauth2` (o `installed` / `web`).
2. Verifica si existe un `token.json` almacenado.
   - **2a. Si existe:** carga el token y retorna el cliente.
   - **2b. Si no existe:** se extiende con **UC-03** para obtener uno nuevo.

**Excepciones:**

- La estructura del JSON no corresponde a ningún tipo conocido → el sistema lanza error `"Estructura de credenciales no reconocida"`.
- Credenciales inválidas rechazadas por Google → se registra el error y se regresa al menú.

---

## UC-02: Seleccionar archivo de credenciales

| Campo               | Detalle                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-02                                                                                                                                                             |
| **Nombre**          | Seleccionar archivo de credenciales                                                                                                                               |
| **Actor primario**  | Operador                                                                                                                                                          |
| **Precondiciones**  | El sistema ha iniciado la sesión.                                                                                                                                 |
| **Postcondiciones** | El archivo de credenciales es leído y disponible para autenticación.                                                                                              |
| **Descripción**     | El sistema solicita la ruta del archivo de credenciales de Google Cloud, con `credenciales.json` como valor por defecto. El operador confirma o modifica la ruta. |

**Flujo Principal:**

1. El sistema muestra el prompt: `"Ubicación de archivo de credenciales:"` con valor por defecto `credenciales.json`.
2. El operador presiona **Enter** (acepta el valor por defecto) o escribe una ruta alternativa.
3. El sistema verifica que el archivo existe en la ruta especificada.
4. El sistema lee y parsea el JSON del archivo.
5. Se invoca **UC-01** para autenticar.

**Excepciones:**

- El archivo no existe en la ruta ingresada → error `"Archivo no encontrado"`, se cancela la importación y se ofrece reintentar (UC-18).
- El archivo no es un JSON válido → error `"El archivo JSON es inválido"`, se cancela la importación.

---

## UC-03: Obtener token OAuth2

| Campo                   | Detalle                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-03                                                                                                                                 |
| **Nombre**              | Obtener token OAuth2                                                                                                                  |
| **Actor primario**      | Operador                                                                                                                              |
| **Actores secundarios** | Google OAuth 2.0                                                                                                                      |
| **Precondiciones**      | El sistema detectó credenciales de tipo OAuth2 y no hay `token.json` almacenado (flujo alternativo 2b de UC-01).                      |
| **Postcondiciones**     | Un `token.json` es guardado en el directorio raíz del proyecto; el cliente OAuth2 queda autenticado.                                  |
| **Descripción**         | El sistema genera la URL de autorización de Google y solicita al operador que la visite e ingrese el código de autorización obtenido. |

**Flujo Principal:**

1. El sistema genera la URL de autorización con los scopes de GTM.
2. El sistema muestra la URL en consola e invita al operador a visitarla.
3. El operador visita la URL, autoriza la aplicación, y copia el código de autorización.
4. El sistema solicita el prompt: `"Introduce el código obtenido en la URL anterior:"`.
5. El operador ingresa el código y presiona **Enter**.
6. El sistema intercambia el código por un token de acceso con Google.
7. El sistema guarda el token en `token.json`.
8. Retorna el cliente autenticado.

**Excepciones:**

- El código de autorización es inválido → Google rechaza el intercambio; el sistema lanza error `"Error al recuperar el token de acceso"`.

---

## UC-04: Seleccionar archivo container.json

| Campo               | Detalle                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-04                                                                                                                        |
| **Nombre**          | Seleccionar archivo container.json                                                                                           |
| **Actor primario**  | Operador                                                                                                                     |
| **Precondiciones**  | La autenticación fue exitosa (UC-01).                                                                                        |
| **Postcondiciones** | La configuración del contenedor a importar es leída y disponible en memoria.                                                 |
| **Descripción**     | El sistema solicita la ruta del archivo de exportación de GTM (container.json), con `container.json` como valor por defecto. |

**Flujo Principal:**

1. El sistema muestra el prompt: `"Ubicación del archivo container.json a importar:"` con valor por defecto `container.json`.
2. El operador presiona **Enter** o ingresa una ruta alternativa.
3. El sistema verifica la existencia del archivo.
4. El sistema lee y parsea el JSON del archivo.
5. La configuración queda disponible para los siguientes pasos.

**Excepciones:**

- El archivo no existe → error `"Archivo no encontrado"`, se cancela la importación y se ofrece reintentar (UC-18).
- El JSON es inválido → error `"El archivo JSON es inválido"`, se cancela la importación.

---

## UC-05: Seleccionar cuenta GTM

| Campo               | Detalle                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-05                                                                                                    |
| **Nombre**          | Seleccionar cuenta GTM                                                                                   |
| **Actor primario**  | Operador                                                                                                 |
| **Precondiciones**  | El archivo `container.json` fue cargado exitosamente (UC-04).                                            |
| **Postcondiciones** | El sistema tiene el `accountPath` de la cuenta GTM destino.                                              |
| **Descripción**     | El sistema lista las cuentas GTM accesibles con las credenciales provistas y el operador selecciona una. |

**Flujo Principal:**

1. El sistema llama a **UC-06** para obtener la lista de cuentas GTM.
2. **Si solo existe una cuenta:** el sistema la selecciona automáticamente y lo notifica al operador.
3. **Si existen múltiples cuentas:** el sistema muestra un prompt de selección con una lista de los nombres de cuenta.
4. El operador selecciona una cuenta y presiona **Enter**.
5. El sistema registra el `accountPath` seleccionado.

**Excepciones:**

- No se encontraron cuentas → advertencia `"Sin cuentas disponibles para estas credenciales"`, se cancela la importación.
- El `accountPath` no puede ser determinado → error crítico, se cancela la importación.

---

## UC-06: Listar cuentas GTM

| Campo                   | Detalle                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ID**                  | UC-06                                                                                                        |
| **Nombre**              | Listar cuentas GTM                                                                                           |
| **Actor primario**      | GTM Importer (sistema)                                                                                       |
| **Actores secundarios** | GTM API v2                                                                                                   |
| **Precondiciones**      | El cliente de autenticación está disponible.                                                                 |
| **Postcondiciones**     | Se retorna un arreglo de objetos con las cuentas GTM accesibles.                                             |
| **Descripción**         | El sistema consulta el endpoint `tagmanager.accounts.list()` de la GTM API v2 y retorna la lista de cuentas. |

**Flujo Principal:**

1. El sistema llama a `tagmanager.accounts.list()`.
2. La GTM API retorna la lista de cuentas con su `accountId`, `name` y `path`.
3. El sistema registra el resultado en el log de sesión.
4. Retorna el arreglo de cuentas.

**Excepciones:**

- Error de red o de API → se lanza la excepción al llamador (UC-05).

---

## UC-07: Seleccionar contenedor GTM

| Campo               | Detalle                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| **ID**              | UC-07                                                                                |
| **Nombre**          | Seleccionar contenedor GTM                                                           |
| **Actor primario**  | Operador                                                                             |
| **Precondiciones**  | Se dispone del `accountPath` de la cuenta seleccionada (UC-05).                      |
| **Postcondiciones** | El sistema tiene el `containerPath` del contenedor GTM destino.                      |
| **Descripción**     | El sistema lista los contenedores de la cuenta seleccionada y el operador elige uno. |

**Flujo Principal:**

1. El sistema llama a **UC-08** para obtener la lista de contenedores.
2. **Si solo existe un contenedor:** el sistema lo selecciona automáticamente y lo notifica.
3. **Si existen múltiples contenedores:** el sistema presenta un prompt de selección.
4. El operador selecciona un contenedor y presiona **Enter**.
5. El sistema registra el `containerPath` seleccionado.

**Excepciones:**

- No se encontraron contenedores en la cuenta → advertencia, se cancela la importación.

---

## UC-08: Listar contenedores GTM

| Campo                   | Detalle                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID**                  | UC-08                                                                          |
| **Nombre**              | Listar contenedores GTM                                                        |
| **Actor primario**      | GTM Importer (sistema)                                                         |
| **Actores secundarios** | GTM API v2                                                                     |
| **Precondiciones**      | Se dispone del `accountPath`.                                                  |
| **Postcondiciones**     | Se retorna un arreglo de contenedores.                                         |
| **Descripción**         | El sistema consulta el endpoint `accounts.containers.list()` de la GTM API v2. |

**Flujo Principal:**

1. El sistema llama a `tagmanager.accounts.containers.list({ parent: accountPath })`.
2. La API retorna los contenedores con `containerId`, `name` y `path`.
3. El resultado es registrado en el log.
4. Retorna el arreglo de contenedores.

**Excepciones:**

- Error de red o de API → se lanza al llamador (UC-07).

---

## UC-09: Seleccionar workspace

| Campo               | Detalle                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ID**              | UC-09                                                                                                        |
| **Nombre**          | Seleccionar workspace                                                                                        |
| **Actor primario**  | Operador                                                                                                     |
| **Precondiciones**  | Se dispone del `containerPath` (UC-07).                                                                      |
| **Postcondiciones** | El sistema tiene un objeto `workspace` con su `path` y `name` listo para usar en la importación.             |
| **Descripción**     | El sistema propone crear un nuevo workspace con nombre automático o usar el workspace existente por defecto. |

**Flujo Principal:**

1. El sistema genera un nombre de workspace automático con la forma: `<NombreContenedor> - <timestamp>`.
2. El sistema muestra el prompt de confirmación: `"¿Deseas crear un NUEVO workspace?"` con valor por defecto **Sí**.
3. **Si el operador confirma (Sí):** se ejecuta **UC-10**.
4. **Si el operador rechaza (No):** se ejecuta **UC-11**.
5. El workspace queda disponible para los siguientes pasos.

---

## UC-10: Crear nuevo workspace

| Campo                   | Detalle                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-10                                                                                               |
| **Nombre**              | Crear nuevo workspace                                                                               |
| **Actor primario**      | GTM Importer (sistema)                                                                              |
| **Actores secundarios** | GTM API v2                                                                                          |
| **Precondiciones**      | El operador eligió crear un nuevo workspace en UC-09.                                               |
| **Postcondiciones**     | Un nuevo workspace es creado en GTM y retornado con su `path` y `name`.                             |
| **Descripción**         | El sistema llama a la GTM API para crear un workspace nuevo con el nombre generado automáticamente. |

**Flujo Principal:**

1. El sistema llama a `tagmanager.accounts.containers.workspaces.create()` con el nombre y una descripción automática que incluye la fecha de creación.
2. La API retorna los datos del workspace creado.
3. El sistema registra el evento `WORKSPACE_CREATED` en el log.
4. Retorna el objeto workspace.

**Excepciones:**

- Error de API al crear workspace → se lanza el error al flujo principal.

---

## UC-11: Obtener workspace existente

| Campo                   | Detalle                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-11                                                                                                                                  |
| **Nombre**              | Obtener workspace existente                                                                                                            |
| **Actor primario**      | GTM Importer (sistema)                                                                                                                 |
| **Actores secundarios** | GTM API v2                                                                                                                             |
| **Precondiciones**      | El operador eligió usar el workspace existente en UC-09.                                                                               |
| **Postcondiciones**     | Se retorna el workspace por defecto del contenedor.                                                                                    |
| **Descripción**         | El sistema consulta los workspaces del contenedor y selecciona el llamado "Default Workspace" o, en su defecto, el primero disponible. |

**Flujo Principal:**

1. El sistema llama a `tagmanager.accounts.containers.workspaces.list()`.
2. Busca un workspace cuyo nombre sea `"Default Workspace"`.
3. Si no lo encuentra, usa el primer workspace de la lista.
4. Registra el evento `WORKSPACE_EXISTING` en el log.
5. Retorna el workspace.

---

## UC-12: Configurar modo de importación

| Campo               | Detalle                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | UC-12                                                                                                                    |
| **Nombre**          | Configurar modo de importación                                                                                           |
| **Actor primario**  | Operador                                                                                                                 |
| **Precondiciones**  | El workspace destino está seleccionado (UC-09).                                                                          |
| **Postcondiciones** | Se establece el `importMode` (`merge` u `overwrite`) y el `conflictStrategy` (`merge` u `overwrite`).                    |
| **Descripción**     | El sistema presenta al operador las opciones de importación y, si corresponde, la estrategia ante conflictos de nombres. |

**Flujo Principal:**

1. El sistema muestra el prompt: `"¿Deseas usar el modo Merge (combinar)?"` con valor por defecto **Sí (merge)**.
   - **Merge:** mantiene elementos existentes que no están en el archivo nuevo.
   - **Overwrite:** reemplaza completamente el contenido del workspace.
2. El operador elige y presiona **Enter**.
3. **Si el modo es Merge:** el sistema muestra un segundo prompt sobre la estrategia ante conflictos de nombres:
   - **Overwrite (conflictos):** la versión del archivo importado reemplaza a la existente.
   - **Merge (conflictos):** intenta fusionar ambas versiones.
4. El operador elige la estrategia de conflictos.
5. Ambas configuraciones quedan registradas en el log.
6. Se invoca **UC-13**.

---

## UC-13: Analizar diferencias (Diff)

| Campo                   | Detalle                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                  | UC-13                                                                                                                                                  |
| **Nombre**              | Analizar diferencias (Diff)                                                                                                                            |
| **Actor primario**      | GTM Importer (sistema)                                                                                                                                 |
| **Actores secundarios** | GTM API v2                                                                                                                                             |
| **Precondiciones**      | El modo de importación y la estrategia de conflictos están definidos (UC-12).                                                                          |
| **Postcondiciones**     | Se presenta al operador un resumen de los cambios: elementos a agregar, en conflicto y a eliminar/mantener, para Tags, Triggers y Variables.           |
| **Descripción**         | El sistema compara los elementos del archivo `container.json` local contra los del workspace remoto, detectando adiciones, conflictos y eliminaciones. |

**Flujo Principal:**

1. El sistema consulta en paralelo a la GTM API los **Tags**, **Triggers** y **Variables** actuales del workspace.
2. El sistema extrae los **Tags**, **Triggers** y **Variables** del `container.json` local.
3. Para cada tipo, el sistema calcula:
   - **Agregados:** en el archivo local pero no en el workspace remoto.
   - **Conflictos:** presentes en ambos lados con el mismo nombre.
   - **A eliminar / mantener:** en el workspace remoto pero no en el archivo local (según el `importMode`).
4. El sistema muestra el **Resumen de Cambios** en consola, diferenciado por tipo de elemento.
5. **Si existen conflictos:** se extiende con **UC-14**.

---

## UC-14: Ver detalle de conflictos

| Campo               | Detalle                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-14                                                                                                               |
| **Nombre**          | Ver detalle de conflictos                                                                                           |
| **Actor primario**  | Operador                                                                                                            |
| **Precondiciones**  | El análisis de diferencias (UC-13) detectó conflictos.                                                              |
| **Postcondiciones** | El operador viene informado de los nombres de los elementos en conflicto (si lo solicitó).                          |
| **Descripción**     | El sistema ofrece al operador la opción de ver los nombres exactos de los elementos en conflicto antes de proceder. |

**Flujo Principal:**

1. El sistema muestra el prompt: `"¿Deseas ver los nombres de los elementos en conflicto?"` con valor por defecto **No**.
2. **Si el operador elige Sí:** el sistema lista en consola los nombres de los Tags, Triggers y Variables en conflicto.
3. **Si el operador elige No:** se omite el detalle.
4. Se continúa hacia UC-15.

---

## UC-15: Confirmar importación

| Campo               | Detalle                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | UC-15                                                                                                                                                              |
| **Nombre**          | Confirmar importación                                                                                                                                              |
| **Actor primario**  | Operador                                                                                                                                                           |
| **Precondiciones**  | El análisis de diferencias fue completado (UC-13).                                                                                                                 |
| **Postcondiciones** | El operador autoriza explícitamente la aplicación de los cambios, o la importación es cancelada.                                                                   |
| **Descripción**     | El sistema requiere una confirmación en tres pasos para prevenir importaciones accidentales: escritura del nombre de la cuenta dos veces y una confirmación final. |

**Flujo Principal:**

1. El sistema advierte al operador que la acción modificará el workspace (solo como borrador).
2. El sistema solicita: `"Para confirmar, escribe el nombre de la cuenta:"`.
3. El operador escribe el nombre de la cuenta y presiona **Enter**.
4. El sistema valida que el nombre ingresado coincide con el nombre de la cuenta seleccionada.
5. El sistema solicita nuevamente: `"Por seguridad, escríbelo una vez más:"`.
6. El operador escribe el nombre por segunda vez.
7. El sistema valida nuevamente.
8. El sistema presenta el prompt de confirmación final: `"¿Estás completamente seguro...?"` con valor por defecto **No**.
9. El operador confirma y presiona **Enter**.
10. Se invoca **UC-16**.

**Excepciones:**

- El nombre ingresado en el paso 3 no coincide → la importación es cancelada con mensaje `"El nombre no coincide"`.
- El nombre ingresado en el paso 6 no coincide → la importación es cancelada.
- El operador responde **No** en el paso 8 → la importación es cancelada; se registra el evento `IMPORT_CANCELLED_BY_USER`.

---

## UC-16: Ejecutar importación

| Campo                   | Detalle                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                  | UC-16                                                                                                                                                  |
| **Nombre**              | Ejecutar importación                                                                                                                                   |
| **Actor primario**      | GTM Importer (sistema)                                                                                                                                 |
| **Actores secundarios** | GTM API v2                                                                                                                                             |
| **Precondiciones**      | El operador confirmó la importación (UC-15).                                                                                                           |
| **Postcondiciones**     | La configuración del `container.json` es aplicada al workspace como un **borrador** en GTM.                                                            |
| **Descripción**         | El sistema envía la petición de importación a la GTM API v2 usando el endpoint `import_container` con el modo y estrategia de conflictos configurados. |

**Flujo Principal:**

1. El sistema registra el evento `IMPORT_START` en el log.
2. El sistema realiza un `POST` a `https://tagmanager.googleapis.com/tagmanager/v2/{workspacePath}:import_container` con:
   - `containerVersion`: el contenido del `container.json`.
   - `importMode`: `merge` u `overwrite`.
   - `conflictStrategy`: `merge` u `overwrite`.
3. La GTM API procesa la solicitud y aplica los cambios como borrador.
4. El sistema registra el evento `IMPORT_SUCCESS` en el log.
5. El sistema informa al operador: `"¡Éxito! Los cambios se han importado correctamente como un borrador."`.
6. El sistema recuerda al operador que un administrador debe publicar los cambios desde la consola GTM.

**Excepciones:**

- Error de API durante la importación → el sistema registra el error y muestra un mensaje genérico al operador, indicando el archivo de log para mayor detalle.

---

## UC-17: Registrar log de sesión

| Campo               | Detalle                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-17                                                                                                                                                                                     |
| **Nombre**          | Registrar log de sesión                                                                                                                                                                   |
| **Actor primario**  | GTM Importer (sistema)                                                                                                                                                                    |
| **Precondiciones**  | El sistema fue iniciado.                                                                                                                                                                  |
| **Postcondiciones** | Todos los eventos de la sesión quedan registrados en un archivo de log con timestamp.                                                                                                     |
| **Descripción**     | El sistema mantiene un archivo de log por sesión en la carpeta `logs/`, registrando inputs del usuario, llamadas a la API, eventos del sistema y errores a lo largo de toda la ejecución. |

**Flujo Principal:**

1. Al iniciar, el sistema crea el directorio `logs/` si no existe y genera el archivo `session-<timestamp>.log`.
2. Durante toda la sesión, cada acción relevante es registrada con: timestamp, nivel (`INFO`, `WARN`, `ERROR`, `API`, `INPUT`, `EVENT`) y mensaje.
3. Al finalizar la sesión, se registra el evento `SESSION_END`.
4. El sistema informa al operador la ruta del archivo de log.

---

## UC-18: Reiniciar proceso

| Campo               | Detalle                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **ID**              | UC-18                                                                                                      |
| **Nombre**          | Reiniciar proceso                                                                                          |
| **Actor primario**  | Operador                                                                                                   |
| **Precondiciones**  | Una importación finalizó (exitosa, cancelada o con error).                                                 |
| **Postcondiciones** | El sistema reinicia el flujo completo desde UC-02, manteniendo el mismo log de sesión.                     |
| **Descripción**     | Al concluir cada ciclo de importación, el sistema pregunta al operador si desea realizar otra importación. |

**Flujo Principal:**

1. El sistema muestra el prompt: `"¿Deseas realizar otra importación?"` con valor por defecto **No**.
2. **Si el operador elige Sí:** el sistema registra `SESSION_RESTART`, muestra un separador visual y vuelve al inicio del flujo (UC-02).
3. **Si el operador elige No:** el sistema registra `SESSION_END` y termina la ejecución con el mensaje `"¡Hasta luego!"`.
