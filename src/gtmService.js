import { google } from 'googleapis';

export class GtmService {
    constructor(auth) {
        this.tagmanager = google.tagmanager({ version: 'v2', auth });
    }

    /**
     * Lists all GTM accounts the user has access to.
     */
    async listAccounts() {
        try {
            const res = await this.tagmanager.accounts.list();
            return res.data.account || [];
        } catch (error) {
            console.error('Error al listar cuentas:', error.message);
            throw error;
        }
    }

    /**
     * Lists containers for a given account.
     * @param {string} accountPath Format: accounts/{accountId}
     */
    async listContainers(accountPath) {
        try {
            const res = await this.tagmanager.accounts.containers.list({ parent: accountPath });
            return res.data.container || [];
        } catch (error) {
            console.error('Error al listar contenedores:', error.message);
            throw error;
        }
    }

    /**
     * Gets default workspace for a container.
     * @param {string} containerPath Format: accounts/{accountId}/containers/{containerId}
     */
    async getDefaultWorkspace(containerPath) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.list({ parent: containerPath });
            const workspaces = res.data.workspace || [];
            // Usually we use the "Default Workspace"
            return workspaces.find(w => w.name === 'Default Workspace') || workspaces[0];
        } catch (error) {
            console.error('Error al obtener workspace:', error.message);
            throw error;
        }
    }

    /**
     * Creates a new workspace in a container.
     * @param {string} containerPath Format: accounts/{accountId}/containers/{containerId}
     * @param {string} name Name of the new workspace
     */
    async createWorkspace(containerPath, name) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.create({
                parent: containerPath,
                requestBody: {
                    name: name,
                    description: `Importado automáticamente por GTM-importer el ${new Date().toLocaleString()}`
                }
            });
            return res.data;
        } catch (error) {
            console.error('Error al crear workspace:', error.message);
            throw error;
        }
    }

    /**
     * Lists all tags in a workspace.
     */
    async listTags(workspacePath) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.tags.list({ parent: workspacePath });
            return res.data.tag || [];
        } catch (error) {
            console.error('Error al listar etiquetas:', error.message);
            throw error;
        }
    }

    /**
     * Lists all triggers in a workspace.
     */
    async listTriggers(workspacePath) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.triggers.list({ parent: workspacePath });
            return res.data.trigger || [];
        } catch (error) {
            console.error('Error al listar activadores:', error.message);
            throw error;
        }
    }

    /**
     * Lists all variables in a workspace.
     */
    async listVariables(workspacePath) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.variables.list({ parent: workspacePath });
            return res.data.variable || [];
        } catch (error) {
            console.error('Error al listar variables:', error.message);
            throw error;
        }
    }

    /**
     * Imports a container configuration into a workspace.
     * Note: Using manual request because import_container might be missing in some versions of the library helpers.
     */
    async importContainer(workspacePath, containerConfig, importMode = 'overwrite', conflictStrategy = 'overwrite') {
        try {
            const url = `https://tagmanager.googleapis.com/tagmanager/v2/${workspacePath}:import_container`;
            
            const res = await this.tagmanager.context.google.auth.request({
                method: 'POST',
                url: url,
                data: {
                    containerVersion: containerConfig,
                    importMode: importMode,
                    conflictStrategy: conflictStrategy
                }
            });
            
            return res.data;
        } catch (error) {
            console.error('Error al importar contenedor:', error.response?.data?.error?.message || error.message);
            throw error;
        }
    }
}
