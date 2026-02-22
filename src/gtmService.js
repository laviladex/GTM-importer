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
     * Imports a container configuration into a workspace.
     */
    async importContainer(workspacePath, containerConfig) {
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.import_container({
                parent: workspacePath,
                requestBody: {
                    containerVersion: containerConfig,
                    importMode: 'overwrite'
                }
            });
            return res.data;
        } catch (error) {
            console.error('Error al importar contenedor:', error.message);
            throw error;
        }
    }
}
