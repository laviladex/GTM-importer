import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';
import inquirer from 'inquirer';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.edit.containers', 'https://www.googleapis.com/auth/tagmanager.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

/**
 * Reads credentials from a given file path.
 * @param {string} credentialsPath 
 */
export async function loadCredentials(credentialsPath) {
    if (!await fs.exists(credentialsPath)) {
        throw new Error(`Archivo de credenciales no encontrado en: ${credentialsPath}`);
    }
    const content = await fs.readJSON(credentialsPath);
    return content;
}

/**
 * Authenticates the user and returns the auth client.
 * @param {Object} credentials 
 */
export async function authorize(credentials) {
    // Check if it's a Service Account
    if (credentials.type === 'service_account') {
        const auth = google.auth.fromJSON(credentials);
        auth.scopes = SCOPES;
        return auth;
    }

    // Default to OAuth2 flow
    const oauthConfig = credentials.installed || credentials.web;
    if (!oauthConfig) {
        throw new Error('Estructura de credenciales no reconocida (ni Service Account ni OAuth2).');
    }

    const { client_secret, client_id, redirect_uris } = oauthConfig;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have a previously stored token.
    if (await fs.exists(TOKEN_PATH)) {
        const token = await fs.readJSON(TOKEN_PATH);
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }

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
    console.log('Autoriza esta aplicación visitando esta URL:', authUrl);
    
    const { code } = await inquirer.prompt([
        {
            name: 'code',
            message: 'Introduce el código obtenido en la URL anterior:',
        }
    ]);

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await fs.writeJSON(TOKEN_PATH, tokens);
        console.log('Token guardado en:', TOKEN_PATH);
        return oAuth2Client;
    } catch (err) {
        throw new Error('Error al recuperar el token de acceso: ' + err.message);
    }
}
