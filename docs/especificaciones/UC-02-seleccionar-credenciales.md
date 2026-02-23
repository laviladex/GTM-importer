# UC-02: Seleccionar archivo de credenciales

| Campo                   | Detalle                                                                                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | UC-02                                                                                                                                                                                                                                          |
| **Nombre**              | Seleccionar archivo de credenciales                                                                                                                                                                                                            |
| **Actor primario**      | Operador                                                                                                                                                                                                                                       |
| **Actores secundarios** | —                                                                                                                                                                                                                                              |
| **Precondiciones**      | El sistema ha iniciado la sesión y el log de sesión está activo.                                                                                                                                                                               |
| **Postcondiciones**     | El archivo de credenciales es leído y su contenido está disponible para la autenticación.                                                                                                                                                      |
| **Descripción**         | El sistema solicita al operador la ruta del archivo de credenciales de Google Cloud, ofreciendo `credenciales.json` como valor por defecto. El operador confirma o modifica la ruta antes de que el sistema intente leer y parsear el archivo. |

---

## Flujo Principal

1. El sistema muestra el prompt:
   ```
   Ubicación de archivo de credenciales: (credenciales.json)
   ```
2. El operador presiona **Enter** para aceptar el valor por defecto (`credenciales.json`) o escribe una ruta alternativa y presiona **Enter**.
3. El sistema registra el valor ingresado en el log de sesión (`userInput: credentialsPath`).
4. El sistema verifica que el archivo existe en la ruta especificada.
5. El sistema lee y parsea el contenido JSON del archivo.
6. El sistema registra en el log el tipo de credencial detectado y la ruta del archivo.
7. Se invoca **[UC-01 — Autenticar con Google](./UC-01-autenticar-con-google.md)**.

---

## Excepciones

| Condición                                                 | Respuesta del sistema                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El archivo no existe en la ruta especificada.             | Muestra: `"✖ Archivo no encontrado."` Registra el error en el log. Cancela la importación y ofrece al operador reintentar ([UC-18](./UC-18-reiniciar-proceso.md)). |
| El archivo existe pero su contenido no es un JSON válido. | Muestra: `"✖ El archivo JSON es inválido o está mal formado."` Registra el error. Cancela la importación.                                                          |

---

## Casos de uso relacionados

- **Incluye:** [UC-01 — Autenticar con Google](./UC-01-autenticar-con-google.md)
- **Puede derivar en:** [UC-18 — Reiniciar proceso](./UC-18-reiniciar-proceso.md) _(en caso de error)_
