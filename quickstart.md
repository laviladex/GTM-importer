# Quick Start Guide - GTM Importer

Este programa permite importar configuraciones de contenedores de Google Tag Manager (GTM) de forma masiva o selectiva.

## Requisitos Previos

1.  **Node.js**: Asegúrate de tener instalada la versión 18 o superior.
2.  **Docker** (Opcional): Si prefieres ejecutarlo en un contenedor.
3.  **Credenciales de Google**:
    - Ve a [Google Cloud Console](https://console.cloud.google.com/).
    - Crea un proyecto y habilita la **Google Tag Manager API**.
    - Crea credenciales de tipo **OAuth 2.0 Client ID** (Escritorio).
    - Descarga el archivo JSON y renombralo a `credenciales.json` en la raíz de este proyecto.

## Instalación

### Localmente

```bash
npm install
```

### Usando Docker

```bash
docker build -t gtm-importer .
```

## Uso

1.  Coloca tu archivo de exportación de GTM como `container.json` en la raíz (o especifica la ruta al iniciar).
2.  Ejecuta el programa:
    ```bash
    npm start
    ```
3.  Sigue las instrucciones en pantalla para autenticarte y seleccionar las cuentas/contenedores de destino.

## Tareas Pendientes

- [ ] Implementar autenticación OAuth2.
- [ ] Crear la librería de gestión de GTM API.
- [ ] Desarrollar la interfaz de consola interactiva.
- [ ] Añadir tests unitarios.
