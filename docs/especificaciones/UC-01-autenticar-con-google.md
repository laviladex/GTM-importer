# UC-01: Autenticar con Google

| Campo                   | Detalle                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-01                                                                                                                   |
| **Nombre**              | Autenticar con Google                                                                                                   |
| **Actor primario**      | GTM Importer (sistema)                                                                                                  |
| **Actores secundarios** | Google OAuth 2.0 / Service Account                                                                                      |
| **Precondiciones**      | El archivo de credenciales fue localizado y leído correctamente (UC-02).                                                |
| **Postcondiciones**     | El sistema obtiene un cliente de autenticación (`auth`) válido con los scopes de GTM habilitados.                       |
| **Descripción**         | El sistema detecta el tipo de credencial (Service Account u OAuth2) y aplica el flujo de autenticación correspondiente. |

---

## Flujo Principal — Service Account

1. El sistema lee el campo `type` del archivo de credenciales.
2. Detecta que el valor es `service_account`.
3. Crea el cliente de autenticación con `google.auth.fromJSON(credentials)`.
4. Asigna los scopes requeridos:
   - `https://www.googleapis.com/auth/tagmanager.edit.containers`
   - `https://www.googleapis.com/auth/tagmanager.readonly`
5. Retorna el cliente autenticado listo para realizar llamadas a la API.

---

## Flujo Alternativo A — OAuth2 con token almacenado

1. El sistema detecta que el tipo de credencial es `oauth2` (estructura `installed` o `web`).
2. Extrae `client_id`, `client_secret` y `redirect_uris` del JSON.
3. Verifica si existe el archivo `token.json` en el directorio raíz del proyecto.
4. **El archivo existe:** carga las credenciales del token y las asigna al cliente OAuth2.
5. Retorna el cliente autenticado.

## Flujo Alternativo B — OAuth2 sin token almacenado

1. El sistema detecta que el tipo de credencial es `oauth2`.
2. Verifica si existe `token.json` → **no existe**.
3. Se extiende con **[UC-03 — Obtener token OAuth2](./UC-03-obtener-token-oauth2.md)** para obtener un token nuevo.
4. Una vez obtenido el token, retorna el cliente autenticado.

---

## Excepciones

| Condición                                                                            | Respuesta del sistema                                                                     |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| El JSON de credenciales no tiene estructura `service_account`, `installed` ni `web`. | Lanza error: `"Estructura de credenciales no reconocida (ni Service Account ni OAuth2)."` |
| Credenciales rechazadas por Google (token inválido, cuenta revocada, etc.).          | Registra el error en el log de sesión y cancela la importación.                           |

---

## Casos de uso relacionados

- **Incluido por:** [UC-02 — Seleccionar archivo de credenciales](./UC-02-seleccionar-credenciales.md)
- **Extiende con:** [UC-03 — Obtener token OAuth2](./UC-03-obtener-token-oauth2.md) _(cuando no hay token almacenado)_
