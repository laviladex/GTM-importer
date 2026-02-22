# Descripción

El programa permite importar la configuración de un contenedor a las cuentas de Google Tag manager a una o varias cuentas a las que tiene acceso el usuario de Google autenticado por medio de las credenciales . Para cada una de las configuraciones permite gestionar las respuestas de GTM para definir las acciones que tomar a fin de completar la importación del contenedor .

# Fuentes

- **Exportación e importación de contenedores Google Tag Manager:**
- [https://support.google.com/tagmanager/answer/6106997?hl=en](https://support.google.com/tagmanager/answer/6106997?hl=en)
- **Google Tag Manager API:** [https://developers.google.com/tag-platform/tag-manager/api/v2](https://developers.google.com/tag-platform/tag-manager/api/v2)
- **Credenciales de Google :** https://docs.cloud.google.com/docs/authentication

# Tecnologías

- Docker
- NodeJs
- Google Tag Manager API

# Setup

Para que el programa funcione, es necesario configurar las credenciales de Google Cloud y otorgar permisos en Google Tag Manager.

## 1. Habilitar la API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto o selecciona uno existente.
3. Navega a **APIs y servicios > Biblioteca**.
4. Busca **"Google Tag Manager API"** y haz clic en **Habilitar**.

## 2. Crear Credenciales

El sistema soporta dos tipos de autenticación. Elige una y guarda el archivo como `credenciales.json` en la raíz del proyecto.

### Opción A: Cuenta de Servicio (Recomendado)

Ideal para procesos donde no se desea una intervención manual constante.

1. En Cloud Console, ve a **APIs y servicios > Credenciales**.
2. Haz clic en **Crear credenciales > Cuenta de servicio**.
3. Sigue los pasos y, una vez creada, entra en la cuenta.
4. Ve a la pestaña **Claves > Agregar clave > Crear clave nueva**.
5. Selecciona **JSON** y descárgalo como `credenciales.json`.
6. **IMPORTANTE**: Copia el email de la cuenta de servicio (ej: `nombre@proyecto.iam.gserviceaccount.com`).
7. Ve a [Google Tag Manager](https://tagmanager.google.com/), entra en la cuenta/contenedor deseado y en **Administración > Gestión de usuarios**, añade el email con permisos de **Administrador**.

### Opción B: ID de Cliente OAuth 2.0

Ideal para actuar en nombre de tu propio usuario.

1. En Cloud Console, ve a **APIs y servicios > Pantalla de consentimiento de OAuth** y configúrala (tipo Externo, añade tu email como usuario de prueba).
2. Ve a **Credenciales > Crear credenciales > ID de cliente de OAuth**.
3. Selecciona **Aplicación de escritorio** (Desktop App).
4. Descarga el archivo JSON y renombralo como `credenciales.json`.
5. Al ejecutar el programa por primera vez, se te proporcionará una URL para autorizar el acceso y obtener un código.

# Tareas

1. Crear autenticación del usuario
2. Crear una librería gestione la importación a los GTM por medio de GTM API
3. Crear la autenticación por medio de un archivo json en la ubicación por defecto
4. Generar el cliente para consola que consume la librería GTM
5. Crear test para la librería

# Glosario

- GTM API Google Tag Manager

# Repositorio

https://github.com/laviladex/GTM-importer.git

# ESPECIFICACIÓN DE CASOS DE USO

# CASO DE USO PRINCIPAL

1. El USUARIO accede al SISTEMA
2. El SISTEMA solicita las credenciales con el valor por defecto ( credenciales.json ) como valor por defecto
3. El USUARIO presiona Enter
4. EL SISTEMA solicita la ubicación del archivo a importar tomando por defecto el valor container.json
5. El USUARIO presiona Enter
6. El SISTEMA muestra el listado de las cuenta de GTM a las que puede acceder con esas credenciales
7. El USUARIO selecciona una cuentas y presiona enter
8. EL SISTEMA muestra el listado de COMPROBACIONES PENDIENTES a realizar , separando los conflictos que existen e invita a proceder presionando enter
9. Repetir pasos 10 y 11 hasta completar
10. El SISTEMA muestra una decisión a tomar por medio de un número , dando por defecto una de las opciones .
11. El USUARIO indica la acción a tomar
12. El SISTEMA muestra el listado de cambios e invita a aprobar la modificación
13. El USUARIO comprueba que las modificaciones son correctas y presiona enter para aprobar
14. El SISTEMA informa la realización de los cambios
