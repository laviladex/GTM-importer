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
