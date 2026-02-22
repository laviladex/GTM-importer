import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import { loadCredentials, authorize } from './auth.js';
import { GtmService } from './gtmService.js';

async function main() {
    console.log(chalk.bold.cyan('\n--- GTM Container Importer ---\n'));

    try {
        // 1. Get Credentials path
        const { credentialsPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'credentialsPath',
                message: 'Ubicación de archivo de credenciales:',
                default: 'credenciales.json'
            }
        ]);

        const credentials = await loadCredentials(credentialsPath);
        const auth = await authorize(credentials);
        const gtm = new GtmService(auth);

        // 2. Get Container JSON path
        const { containerPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'containerPath',
                message: 'Ubicación del archivo container.json a importar:',
                default: 'container.json'
            }
        ]);

        if (!await fs.exists(containerPath)) {
            console.error(chalk.red(`Error: El archivo ${containerPath} no existe.`));
            return;
        }
        const containerConfig = await fs.readJSON(containerPath);

        // 3. List Accounts
        console.log(chalk.yellow('\nBuscando cuentas de GTM...'));
        const accounts = await gtm.listAccounts();
        
        if (accounts.length === 0) {
            console.log(chalk.red('No se encontraron cuentas asociadas a estas credenciales.'));
            return;
        }

        const { accountPath } = await inquirer.prompt([
            {
                type: 'list',
                name: 'accountPath',
                message: 'Selecciona una cuenta:',
                choices: accounts.map(a => ({ name: a.name, value: a.path }))
            }
        ]);

        // 4. List Containers
        const containers = await gtm.listContainers(accountPath);
        
        if (containers.length === 0) {
            console.log(chalk.red('No se encontraron contenedores en esta cuenta.'));
            return;
        }

        const { containerPath: selectedContainerPath } = await inquirer.prompt([
            {
                type: 'list',
                name: 'containerPath',
                message: 'Selecciona el contenedor de destino:',
                choices: containers.map(c => ({ name: c.name, value: c.path }))
            }
        ]);

        // 5. Get Workspace
        const workspace = await gtm.getDefaultWorkspace(selectedContainerPath);
        console.log(chalk.green(`\nUsando workspace: ${workspace.name}`));

        // 6. Confirm and Import
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `¿Estás seguro de que deseas importar ${containerPath} en ${selectedContainerPath}? (Modo: Overwrite)`,
                default: false
            }
        ]);

        if (confirm) {
            console.log(chalk.blue('Importando...'));
            const result = await gtm.importContainer(workspace.path, containerConfig);
            console.log(chalk.bold.green('\n¡Importación completada con éxito!'));
            // console.log(result);
        } else {
            console.log(chalk.yellow('Importación cancelada.'));
        }

    } catch (error) {
        console.error(chalk.red('\nOcurrió un error crítico:'), error.message);
        if (error.stack) {
            // console.error(error.stack);
        }
    }
}

main();
