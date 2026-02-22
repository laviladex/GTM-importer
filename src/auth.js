import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';
import inquirer from 'inquirer';
import { logger } from './logger.js';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.edit.containers', 'https://www.googleapis.com/auth/tagmanager.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

/**
 * Reads credentials from a given file path.
 * @param {string} credentialsPath 
 */
export async function loadCredentials(credentialsPath) {
    logger.info(`Cargando credenciales desde: ${credentialsPath}`);
    if (!await fs.exists(credentialsPath)) {
        const msg = `Archivo de credenciales no encontrado en: ${credentialsPath}`;
        logger.error(msg);
        throw new Error(msg);
    }
    const content = await fs.readJSON(credentialsPath);
    logger.info(`Credenciales leídas. Tipo detectado: ${content.type || 'oauth2'}`);
    return content;
}

/**
 * Authenticates the user and returns the auth client.
 * @param {Object} credentials 
 */
export async function authorize(credentials) {
    // Check if it's a Service Account
    if (credentials.type === 'service_account') {
        logger.info('Usando autenticación de Service Account.');
        const auth = google.auth.fromJSON(credentials);
        auth.scopes = SCOPES;
        return auth;
    }

    // Default to OAuth2 flow
    const oauthConfig = credentials.installed || credentials.web;
    if (!oauthConfig) {
        const msg = 'Estructura de credenciales no reconocida (ni Service Account ni OAuth2).';
        logger.error(msg);
        throw new Error(msg);
    }

    logger.info('Usando autenticación OAuth2.');
    const { client_secret, client_id, redirect_uris } = oauthConfig;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have a previously stored token.
    if (await fs.exists(TOKEN_PATH)) {
        logger.info(`Token OAuth2 encontrado en: ${TOKEN_PATH}`);
        const token = await fs.readJSON(TOKEN_PATH);
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }

    logger.info('No se encontró token almacenado. Iniciando flujo de obtención de nuevo token.');
    return await getNewToken(oAuth2Client);
}

/**
 * Gets and stores new auth token.
 * @param {google.auth.OAuth2} oAuth2Client 
 */
async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    logger.info(`URL de autorización generada: ${authUrl}`);
    console.log('Autoriza esta aplicación visitando esta URL:', authUrl);
    
    const { code } = await inquirer.prompt([
        {
            name: 'code',
            message: 'Introduce el código obtenido en la URL anterior:',
        }
    ]);
    logger.userInput('authCode', '[REDACTED]');

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await fs.writeJSON(TOKEN_PATH, tokens);
        logger.info(`Token OAuth2 guardado en: ${TOKEN_PATH}`);
        console.log('Token guardado en:', TOKEN_PATH);
        return oAuth2Client;
    } catch (err) {
        const msg = 'Error al recuperar el token de acceso: ' + err.message;
        logger.error(msg);
        throw new Error(msg);
    }
}
