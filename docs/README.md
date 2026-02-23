# Documentación — GTM Importer

Este directorio contiene la documentación técnica y de análisis del sistema **GTM Importer**.

## Estructura

| Archivo                            | Tipo     | Descripción                                     |
| ---------------------------------- | -------- | ----------------------------------------------- |
| `contexto.puml`                    | PlantUML | Diagrama de contexto del sistema                |
| `entidades.puml`                   | PlantUML | Diagrama de relación de entidades               |
| `casos_de_uso.puml`                | PlantUML | Diagrama de casos de uso                        |
| `especificaciones_casos_de_uso.md` | Markdown | Especificaciones detalladas de cada caso de uso |

---

## Diagrama de Contexto

Muestra las interacciones del sistema con los actores y sistemas externos dentro de su alcance.

**Archivo:** [`contexto.puml`](./contexto.puml)

**Actores y sistemas externos:**

- **Operador** — El usuario humano que ejecuta la herramienta CLI y responde los prompts interactivos.
- **Google OAuth 2.0 / Service Account** _(externo)_ — Proveedor de autenticación de Google Cloud.
- **GTM API v2** _(externo)_ — API REST de Google Tag Manager, fuente y destino de los datos de cuentas, contenedores, workspaces y configuración GTM.
- **Sistema de Archivos Local** _(externo)_ — Origen de los archivos de credenciales (`credenciales.json`), configuración a importar (`container.json`) y destino de los logs de sesión y el token OAuth2.

---

## Diagrama de Relación de Entidades

Describe las entidades del dominio y sus relaciones, incluyendo tanto los conceptos del sistema local como los recursos gestionados a través de la GTM API.

**Archivo:** [`entidades.puml`](./entidades.puml)

**Entidades principales:**

| Entidad             | Descripción                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `Sesion`            | Representa una ejecución del programa, identificada por timestamp y PID.          |
| `Credencial`        | Archivo JSON con las credenciales de Google Cloud (OAuth2 o Service Account).     |
| `Token`             | Token de acceso OAuth2 almacenado en disco tras la primera autenticación.         |
| `ArchivoContenedor` | Archivo `container.json` exportado desde GTM que se desea importar.               |
| `CuentaGTM`         | Cuenta de Google Tag Manager accesible con las credenciales provistas.            |
| `ContenedorGTM`     | Contenedor dentro de una cuenta GTM, identifica un sitio web o app.               |
| `Workspace`         | Espacio de trabajo dentro de un contenedor; los cambios se aplican como borrador. |
| `Tag`               | Etiqueta de seguimiento/analytics configurada en GTM.                             |
| `Trigger`           | Activador que determina cuándo se dispara un tag.                                 |
| `Variable`          | Variable disponible para usar en tags y triggers.                                 |
| `Importacion`       | Registro de la operación de importación ejecutada.                                |
| `LogSesion`         | Archivo de log generado por sesión de ejecución.                                  |

---

## Diagrama de Casos de Uso

Visualiza los casos de uso del sistema, los actores involucrados y las relaciones de inclusión y extensión.

**Archivo:** [`casos_de_uso.puml`](./casos_de_uso.puml)

**Resumen de casos de uso:**

| ID    | Caso de Uso                         | Actor Principal          |
| ----- | ----------------------------------- | ------------------------ |
| UC-01 | Autenticar con Google               | Sistema                  |
| UC-02 | Seleccionar archivo de credenciales | Operador                 |
| UC-03 | Obtener token OAuth2                | Operador / Google OAuth2 |
| UC-04 | Seleccionar archivo container.json  | Operador                 |
| UC-05 | Seleccionar cuenta GTM              | Operador                 |
| UC-06 | Listar cuentas GTM                  | Sistema / GTM API        |
| UC-07 | Seleccionar contenedor GTM          | Operador                 |
| UC-08 | Listar contenedores GTM             | Sistema / GTM API        |
| UC-09 | Seleccionar workspace               | Operador                 |
| UC-10 | Crear nuevo workspace               | Sistema / GTM API        |
| UC-11 | Obtener workspace existente         | Sistema / GTM API        |
| UC-12 | Configurar modo de importación      | Operador                 |
| UC-13 | Analizar diferencias (Diff)         | Sistema / GTM API        |
| UC-14 | Ver detalle de conflictos           | Operador                 |
| UC-15 | Confirmar importación               | Operador                 |
| UC-16 | Ejecutar importación                | Sistema / GTM API        |
| UC-17 | Registrar log de sesión             | Sistema                  |
| UC-18 | Reiniciar proceso                   | Operador                 |

---

## Especificaciones de Casos de Uso

Las especificaciones detalladas de cada caso de uso, incluyendo precondiciones, postcondiciones, flujo principal y excepciones, se encuentran en:

📄 [`especificaciones_casos_de_uso.md`](./especificaciones_casos_de_uso.md)
