# UC-03: Obtener token OAuth2

| Campo                   | Detalle                                                                                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-03                                                                                                                                                                                                                                                                                  |
| **Nombre**              | Obtener token OAuth2                                                                                                                                                                                                                                                                   |
| **Actor primario**      | Operador                                                                                                                                                                                                                                                                               |
| **Actores secundarios** | Google OAuth 2.0                                                                                                                                                                                                                                                                       |
| **Precondiciones**      | El sistema detectó credenciales de tipo OAuth2 y verificó que **no existe** el archivo `token.json` almacenado localmente. Este caso de uso es una extensión del flujo alternativo B de [UC-01](./UC-01-autenticar-con-google.md).                                                     |
| **Postcondiciones**     | Un archivo `token.json` válido es guardado en el directorio raíz del proyecto. El cliente OAuth2 queda autenticado y listo para realizar llamadas a la GTM API.                                                                                                                        |
| **Descripción**         | El sistema genera la URL de autorización de Google y solicita al operador que la visite en un navegador, otorgue los permisos a la aplicación y copie el código de autorización obtenido. El sistema intercambia ese código por un token de acceso que almacena para sesiones futuras. |

---

## Flujo Principal

1. El sistema genera la URL de autorización con los scopes:
   - `https://www.googleapis.com/auth/tagmanager.edit.containers`
   - `https://www.googleapis.com/auth/tagmanager.readonly`
2. El sistema muestra la URL en consola con el mensaje:
   ```
   Autoriza esta aplicación visitando esta URL: <URL>
   ```
3. El sistema registra la URL generada en el log de sesión.
4. El operador abre la URL en un navegador, selecciona su cuenta de Google y otorga los permisos solicitados.
5. Google muestra el código de autorización al operador.
6. El sistema muestra el prompt:
   ```
   Introduce el código obtenido en la URL anterior:
   ```
7. El operador copia y pega el código, luego presiona **Enter**.
8. El sistema registra en el log que se recibió un código de autorización (valor redactado: `[REDACTED]`).
9. El sistema envía el código a Google para intercambiarlo por tokens de acceso y refresco.
10. Google retorna los tokens.
11. El sistema asigna los tokens al cliente OAuth2.
12. El sistema guarda los tokens en `token.json` en el directorio raíz del proyecto.
13. El sistema registra en el log la ruta donde fue guardado el token.
14. Retorna el cliente OAuth2 autenticado.

---

## Excepciones

| Condición                                                 | Respuesta del sistema                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| El código de autorización ingresado es inválido o expiró. | Google rechaza el intercambio. El sistema lanza error: `"Error al recuperar el token de acceso: <detalle>"` y cancela la importación. |
| Error de red al contactar el endpoint de token de Google. | El sistema lanza error con el mensaje de red correspondiente y cancela la importación.                                                |

---

## Casos de uso relacionados

- **Extendido desde:** [UC-01 — Autenticar con Google](./UC-01-autenticar-con-google.md) _(flujo alternativo B)_
