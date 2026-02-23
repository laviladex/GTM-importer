# UC-06: Listar cuentas GTM

| Campo                   | Detalle                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-06                                                                                                                                                                                         |
| **Nombre**              | Listar cuentas GTM                                                                                                                                                                            |
| **Actor primario**      | GTM Importer (sistema)                                                                                                                                                                        |
| **Actores secundarios** | GTM API v2                                                                                                                                                                                    |
| **Precondiciones**      | El cliente de autenticación (`auth`) está disponible y los scopes de GTM están habilitados.                                                                                                   |
| **Postcondiciones**     | Se retorna un arreglo de objetos de cuenta, cada uno con al menos los campos `accountId`, `name` y `path`.                                                                                    |
| **Descripción**         | El sistema realiza una consulta al endpoint `tagmanager.accounts.list()` de la GTM API v2 para obtener todas las cuentas de Google Tag Manager a las que el usuario autenticado tiene acceso. |

---

## Flujo Principal

1. El sistema registra en el log: `"Llamando a tagmanager.accounts.list()"`.
2. El sistema llama al endpoint:
   ```
   GET https://tagmanager.googleapis.com/tagmanager/v2/accounts
   ```
3. La GTM API retorna el objeto de respuesta con el campo `data.account` conteniendo el arreglo de cuentas.
4. El sistema extrae el arreglo (o un arreglo vacío si no hay cuentas).
5. El sistema registra en el log la respuesta completa de la API (`apiResponse: listAccounts`), incluyendo la cantidad total de cuentas.
6. Retorna el arreglo de cuentas al caso de uso llamador ([UC-05](./UC-05-seleccionar-cuenta-gtm.md)).

---

## Estructura de cada objeto de cuenta retornado

```json
{
  "accountId": "123456789",
  "name": "Nombre de la Cuenta",
  "path": "accounts/123456789",
  "shareData": false
}
```

---

## Excepciones

| Condición                                                | Respuesta del sistema                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error de autenticación (401/403).                        | El sistema registra el error en el log (`apiError: listAccounts`) y relanza la excepción al llamador ([UC-05](./UC-05-seleccionar-cuenta-gtm.md)). |
| Error de red (`ENOTFOUND`, `ETIMEDOUT`, `ECONNREFUSED`). | El sistema registra el error y relanza la excepción al llamador.                                                                                   |
| Límite de cuota de la API alcanzado (429).               | El sistema registra la advertencia y relanza la excepción al llamador.                                                                             |

---

## Casos de uso relacionados

- **Incluido por:** [UC-05 — Seleccionar cuenta GTM](./UC-05-seleccionar-cuenta-gtm.md)
