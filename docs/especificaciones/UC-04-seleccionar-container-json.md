# UC-04: Seleccionar archivo container.json

| Campo                   | Detalle                                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                  | UC-04                                                                                                                                                                                                                                                                          |
| **Nombre**              | Seleccionar archivo container.json                                                                                                                                                                                                                                             |
| **Actor primario**      | Operador                                                                                                                                                                                                                                                                       |
| **Actores secundarios** | —                                                                                                                                                                                                                                                                              |
| **Precondiciones**      | La autenticación con Google fue completada exitosamente ([UC-01](./UC-01-autenticar-con-google.md)).                                                                                                                                                                           |
| **Postcondiciones**     | La configuración del contenedor GTM a importar es leída desde el archivo JSON y está disponible en memoria para los pasos siguientes.                                                                                                                                          |
| **Descripción**         | El sistema solicita al operador la ruta del archivo de exportación de GTM (`container.json`), ofreciendo `container.json` como valor por defecto. Este archivo contiene la definición completa de tags, triggers y variables que serán importados al workspace de GTM destino. |

---

## Flujo Principal

1. El sistema muestra el prompt:
   ```
   Ubicación del archivo container.json a importar: (container.json)
   ```
2. El operador presiona **Enter** para aceptar el valor por defecto (`container.json`) o escribe una ruta alternativa y presiona **Enter**.
3. El sistema registra el valor ingresado en el log de sesión (`userInput: containerPath`).
4. El sistema verifica si el archivo existe en la ruta especificada usando el sistema de archivos local.
5. El sistema lee y parsea el contenido JSON del archivo.
6. El sistema registra en el log que el archivo fue cargado correctamente.
7. La configuración del contenedor queda disponible en memoria para los casos de uso posteriores.

---

## Estructura esperada del archivo

El archivo `container.json` debe contener una estructura de exportación estándar de GTM. El sistema acepta dos formas:

```json
{
  "containerVersion": {
    "container": { "name": "Mi Contenedor" },
    "tag": [ ... ],
    "trigger": [ ... ],
    "variable": [ ... ]
  }
}
```

o directamente en la raíz:

```json
{
  "tag": [ ... ],
  "trigger": [ ... ],
  "variable": [ ... ]
}
```

---

## Excepciones

| Condición                                                 | Respuesta del sistema                                                                                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El archivo no existe en la ruta especificada.             | Muestra: `"✖ Archivo no encontrado."` Registra el error en el log. La función `runImport()` retorna `false` y se ofrece al operador reintentar ([UC-18](./UC-18-reiniciar-proceso.md)). |
| El archivo existe pero su contenido no es un JSON válido. | Muestra: `"✖ El archivo JSON es inválido o está mal formado."` Registra el error. Cancela la importación.                                                                               |

---

## Casos de uso relacionados

- **Precede a:** [UC-05 — Seleccionar cuenta GTM](./UC-05-seleccionar-cuenta-gtm.md)
- **Puede derivar en:** [UC-18 — Reiniciar proceso](./UC-18-reiniciar-proceso.md) _(en caso de error)_
