import { google } from 'googleapis';
import { logger } from './logger.js';

export class GtmService {
    constructor(auth) {
        this.auth = auth;
        this.tagmanager = google.tagmanager({ version: 'v2', auth });
    }

    /**
     * Lists all GTM accounts the user has access to.
     */
    async listAccounts() {
        logger.info('Llamando a tagmanager.accounts.list()');
        try {
            const res = await this.tagmanager.accounts.list();
            const accounts = res.data.account || [];
            logger.apiResponse('listAccounts', { total: accounts.length, accounts });
            return accounts;
        } catch (error) {
            logger.apiError('listAccounts', error);
            console.error('Error al listar cuentas:', error.message);
            throw error;
        }
    }

    /**
     * Lists containers for a given account.
     * @param {string} accountPath Format: accounts/{accountId}
     */
    async listContainers(accountPath) {
        logger.info(`Llamando a listContainers para: ${accountPath}`);
        try {
            const res = await this.tagmanager.accounts.containers.list({ parent: accountPath });
            const containers = res.data.container || [];
            logger.apiResponse('listContainers', { accountPath, total: containers.length, containers });
            return containers;
        } catch (error) {
            logger.apiError('listContainers', error);
            console.error('Error al listar contenedores:', error.message);
            throw error;
        }
    }

    /**
     * Gets default workspace for a container.
     * @param {string} containerPath Format: accounts/{accountId}/containers/{containerId}
     */
    async getDefaultWorkspace(containerPath) {
        logger.info(`Llamando a getDefaultWorkspace para: ${containerPath}`);
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.list({ parent: containerPath });
            const workspaces = res.data.workspace || [];
            logger.apiResponse('getDefaultWorkspace', { containerPath, total: workspaces.length, workspaces });
            const ws = workspaces.find(w => w.name === 'Default Workspace') || workspaces[0];
            logger.info(`Workspace seleccionado: ${ws?.name} (${ws?.path})`);
            return ws;
        } catch (error) {
            logger.apiError('getDefaultWorkspace', error);
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
        logger.info(`Creando workspace "${name}" en: ${containerPath}`);
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.create({
                parent: containerPath,
                requestBody: {
                    name: name,
                    description: `Importado automáticamente por GTM-importer el ${new Date().toLocaleString()}`
                }
            });
            logger.apiResponse('createWorkspace', res.data);
            return res.data;
        } catch (error) {
            logger.apiError('createWorkspace', error);
            console.error('Error al crear workspace:', error.message);
            throw error;
        }
    }

    /**
     * Lists all tags in a workspace.
     */
    async listTags(workspacePath) {
        logger.info(`Llamando a listTags para: ${workspacePath}`);
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.tags.list({ parent: workspacePath });
            const tags = res.data.tag || [];
            logger.apiResponse('listTags', { workspacePath, total: tags.length, tags });
            return tags;
        } catch (error) {
            logger.apiError('listTags', error);
            console.error('Error al listar etiquetas:', error.message);
            throw error;
        }
    }

    /**
     * Lists all triggers in a workspace.
     */
    async listTriggers(workspacePath) {
        logger.info(`Llamando a listTriggers para: ${workspacePath}`);
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.triggers.list({ parent: workspacePath });
            const triggers = res.data.trigger || [];
            logger.apiResponse('listTriggers', { workspacePath, total: triggers.length, triggers });
            return triggers;
        } catch (error) {
            logger.apiError('listTriggers', error);
            console.error('Error al listar activadores:', error.message);
            throw error;
        }
    }

    /**
     * Lists all variables in a workspace.
     */
    async listVariables(workspacePath) {
        logger.info(`Llamando a listVariables para: ${workspacePath}`);
        try {
            const res = await this.tagmanager.accounts.containers.workspaces.variables.list({ parent: workspacePath });
            const variables = res.data.variable || [];
            logger.apiResponse('listVariables', { workspacePath, total: variables.length, variables });
            return variables;
        } catch (error) {
            logger.apiError('listVariables', error);
            console.error('Error al listar variables:', error.message);
            throw error;
        }
    }

    /**
     * Imports a container configuration into a workspace.
     * Note: Using manual request because import_container might be missing in some versions of the library helpers.
     */
    async importContainer(workspacePath, containerConfig, importMode = 'overwrite', conflictStrategy = 'overwrite') {
        logger.info(`Importando contenedor en: ${workspacePath} | modo=${importMode} | conflicto=${conflictStrategy}`);
        try {
            const url = `https://tagmanager.googleapis.com/tagmanager/v2/${workspacePath}:import_container`;

            const res = await this.auth.request({
                method: 'POST',
                url: url,
                data: {
                    containerVersion: containerConfig,
                    importMode: importMode,
                    conflictStrategy: conflictStrategy
                },
                headers: { 'Content-Type': 'application/json' }
            });

            logger.apiResponse('importContainer', res.data);
            return res.data;
        } catch (error) {
            logger.apiError('importContainer', error);
            console.error('Error al importar contenedor:', error.response?.data?.error?.message || error.message);
            throw error;
        }
    }
}
