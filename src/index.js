import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import { loadCredentials, authorize } from './auth.js';
import { GtmService } from './gtmService.js';
import { logger } from './logger.js';

async function main() {
    console.log(chalk.bold.cyan('\n--- GTM Container Importer ---\n'));
    logger.event('SESSION_START', { pid: process.pid, cwd: process.cwd() });
    console.log(chalk.gray(`Log de sesión: ${logger.filePath}`));

    try {
        // 1. Credentials
        const { credentialsPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'credentialsPath',
                message: 'Ubicación de archivo de credenciales:',
                default: 'credenciales.json'
            }
        ]);
        logger.userInput('credentialsPath', credentialsPath);

        const credentials = await loadCredentials(credentialsPath);
        logger.info(`Credenciales cargadas desde: ${credentialsPath} | tipo: ${credentials.type || 'oauth2'}`);

        const auth = await authorize(credentials);
        logger.info('Autorización completada.');

        const gtm = new GtmService(auth);

        // 2. Container JSON
        const { containerPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'containerPath',
                message: 'Ubicación del archivo container.json a importar:',
                default: 'container.json'
            }
        ]);
        logger.userInput('containerPath', containerPath);

        if (!await fs.exists(containerPath)) {
            const msg = `El archivo ${containerPath} no existe.`;
            logger.error(msg);
            console.error(chalk.red(`Error: ${msg}`));
            return;
        }
        const containerConfig = await fs.readJSON(containerPath);
        logger.info(`container.json cargado desde: ${containerPath}`);

        // 3. List Accounts
        console.log(chalk.yellow('\nBuscando cuentas de GTM...'));
        const accounts = await gtm.listAccounts();
        console.log(chalk.gray(`Se encontraron ${accounts.length} cuenta(s).`));
        logger.info(`Cuentas encontradas: ${accounts.length}`);

        if (accounts.length === 0) {
            logger.warn('No se encontraron cuentas asociadas a las credenciales.');
            console.log(chalk.red('No se encontraron cuentas asociadas a estas credenciales.'));
            return;
        }

        let accountPath;
        if (accounts.length === 1) {
            const only = accounts[0];
            accountPath = only.path || `accounts/${only.accountId}`;
            logger.event('ACCOUNT_AUTO_SELECTED', { name: only.name, path: accountPath });
            console.log(chalk.green(`Cuenta auto-seleccionada: ${chalk.bold(only.name)} (${accountPath})`));
        } else {
            const ans = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedPath',
                    message: 'Selecciona una cuenta:',
                    choices: accounts.map(a => ({
                        name: a.name || 'Sin nombre',
                        value: a.path || `accounts/${a.accountId}`
                    }))
                }
            ]);
            accountPath = ans.selectedPath;
            logger.userInput('selectedAccountPath', accountPath);
        }

        if (!accountPath) {
            const msg = 'No se pudo determinar una ruta de cuenta válida.';
            logger.error(msg);
            console.error(chalk.red(`\nError: ${msg}`));
            return;
        }

        // 4. List Containers
        console.log(chalk.yellow(`\nBuscando contenedores para: ${accountPath}...`));
        const containers = await gtm.listContainers(accountPath);
        console.log(chalk.gray(`Se encontraron ${containers.length} contenedor(es).`));
        logger.info(`Contenedores encontrados: ${containers.length}`);

        if (!containers || containers.length === 0) {
            logger.warn(`No se encontraron contenedores en la cuenta: ${accountPath}`);
            console.log(chalk.red('No se encontraron contenedores en esta cuenta.'));
            return;
        }

        let selectedContainerPath;
        if (containers.length === 1) {
            const only = containers[0];
            selectedContainerPath = only.path;
            logger.event('CONTAINER_AUTO_SELECTED', { name: only.name, path: selectedContainerPath });
            console.log(chalk.green(`Contenedor auto-seleccionado: ${chalk.bold(only.name)} (${selectedContainerPath})`));
        } else {
            const ans = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'containerPath',
                    message: 'Selecciona el contenedor de destino:',
                    choices: containers.map(c => ({ name: c.name, value: c.path }))
                }
            ]);
            selectedContainerPath = ans.containerPath;
            logger.userInput('selectedContainerPath', selectedContainerPath);
        }

        if (!selectedContainerPath) {
            const msg = 'No se pudo determinar una ruta de contenedor válida.';
            logger.error(msg);
            console.error(chalk.red(`\nError: ${msg}`));
            return;
        }

        // 5. Create or Get Workspace
        const containerName = containerConfig.containerVersion?.container?.name || 'Import Workspace';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const newWorkspaceName = `${containerName} - ${timestamp}`;

        const { createNew } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'createNew',
                message: `¿Deseas crear un NUEVO workspace llamado "${chalk.bold(newWorkspaceName)}" para esta importación?`,
                default: true
            }
        ]);
        logger.userInput('createNew', createNew);

        let workspace;
        if (createNew) {
            console.log(chalk.yellow(`\nCreando nuevo workspace: ${newWorkspaceName}...`));
            workspace = await gtm.createWorkspace(selectedContainerPath, newWorkspaceName);
            logger.event('WORKSPACE_CREATED', { name: workspace.name, path: workspace.path });
            console.log(chalk.green(`Workspace creado: ${workspace.name}`));
        } else {
            workspace = await gtm.getDefaultWorkspace(selectedContainerPath);
            logger.event('WORKSPACE_EXISTING', { name: workspace.name, path: workspace.path });
            console.log(chalk.green(`\nUsando workspace existente: ${workspace.name}`));
        }

        // 6. Import Mode & Conflict Strategy (BEFORE the diff)
        console.log(chalk.cyan('\n--- CONFIGURACIÓN DE IMPORTACIÓN ---'));

        const { useMerge } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useMerge',
                message: `¿Deseas usar el modo Merge (combinar)?\n  ${chalk.green('Sí')} → Mantiene los elementos existentes que NO están en el archivo nuevo\n  ${chalk.red('No')} → Overwrite: borra TODOS los elementos actuales y los sustituye`,
                default: true
            }
        ]);
        const importMode = useMerge ? 'merge' : 'overwrite';
        logger.userInput('importMode', importMode);
        console.log(chalk.gray(`  Modo seleccionado: ${chalk.bold(importMode)}`));

        let conflictStrategy = 'overwrite';
        if (importMode === 'merge') {
            const { useOverwriteOnConflict } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'useOverwriteOnConflict',
                    message: `En caso de conflicto de nombres (elemento existe en ambos lados):\n  ${chalk.green('Sí')} → Overwrite: se usa la versión del archivo importado\n  ${chalk.red('No')} → Merge: intenta fusionar los contenidos de ambas versiones`,
                    default: true
                }
            ]);
            conflictStrategy = useOverwriteOnConflict ? 'overwrite' : 'merge';
            logger.userInput('conflictStrategy', conflictStrategy);
            console.log(chalk.gray(`  Estrategia de conflictos: ${chalk.bold(conflictStrategy)}`));
        }

        // 7. Analyze diff (now contextualized with the chosen mode)
        console.log(chalk.yellow('\nAnalizando diferencias y posibles impactos...'));
        logger.event('DIFF_ANALYSIS_START', { workspace: workspace.path, importMode, conflictStrategy });

        const [remoteTags, remoteTriggers, remoteVariables] = await Promise.all([
            gtm.listTags(workspace.path),
            gtm.listTriggers(workspace.path),
            gtm.listVariables(workspace.path)
        ]);

        const localTags    = containerConfig.containerVersion?.tag      || containerConfig.tag      || [];
        const localTriggers= containerConfig.containerVersion?.trigger   || containerConfig.trigger   || [];
        const localVariables=containerConfig.containerVersion?.variable  || containerConfig.variable  || [];

        const compare = (local, remote) => ({
            added:     local.filter(l => !remote.find(r => r.name === l.name)),
            conflicts: local.filter(l =>  remote.find(r => r.name === l.name)),
            deleted:   remote.filter(r => !local.find(l => l.name === r.name))
        });

        const tagDiff      = compare(localTags, remoteTags);
        const triggerDiff  = compare(localTriggers, remoteTriggers);
        const variableDiff = compare(localVariables, remoteVariables);

        logger.event('DIFF_RESULT', {
            tags:      { added: tagDiff.added.length,      conflicts: tagDiff.conflicts.length,      deleted: tagDiff.deleted.length },
            triggers:  { added: triggerDiff.added.length,  conflicts: triggerDiff.conflicts.length,  deleted: triggerDiff.deleted.length },
            variables: { added: variableDiff.added.length, conflicts: variableDiff.conflicts.length, deleted: variableDiff.deleted.length }
        });

        console.log(chalk.bold('\n--- RESUMEN DE CAMBIOS ---'));

        const showSection = (title, diff) => {
            console.log(chalk.cyan(`\n${title}:`));
            if (diff.added.length > 0)
                console.log(chalk.green(`  [+] Se añadirán:                ${diff.added.length}`));
            if (diff.conflicts.length > 0) {
                const action = conflictStrategy === 'overwrite' ? 'se sobrescribirán' : 'se fusionarán';
                console.log(chalk.yellow(`  [!] Conflictos (${action}):  ${diff.conflicts.length}`));
            }
            if (importMode === 'overwrite') {
                if (diff.deleted.length > 0)
                    console.log(chalk.red(`  [-] Se eliminarán (reemplazo): ${diff.deleted.length}`));
            } else {
                if (diff.deleted.length > 0)
                    console.log(chalk.gray(`  [ ] Permanecerán intactos:      ${diff.deleted.length}`));
            }
            if (diff.added.length === 0 && diff.conflicts.length === 0 && diff.deleted.length === 0)
                console.log('  Sin cambios detectados.');
        };

        showSection('Etiquetas (Tags)', tagDiff);
        showSection('Activadores (Triggers)', triggerDiff);
        showSection('Variables', variableDiff);

        const hasConflicts = tagDiff.conflicts.length > 0 || triggerDiff.conflicts.length > 0 || variableDiff.conflicts.length > 0;
        if (hasConflicts) {
            const { showDetails } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'showDetails',
                    message: '¿Deseas ver los nombres de los elementos en conflicto?',
                    default: false
                }
            ]);
            logger.userInput('showConflictDetails', showDetails);
            if (showDetails) {
                const names = list => list.map(i => i.name).join(', ');
                if (tagDiff.conflicts.length > 0)      console.log(chalk.yellow('\nConflictos Tags:'),      names(tagDiff.conflicts));
                if (triggerDiff.conflicts.length > 0)  console.log(chalk.yellow('Conflictos Triggers:'),  names(triggerDiff.conflicts));
                if (variableDiff.conflicts.length > 0) console.log(chalk.yellow('Conflictos Variables:'), names(variableDiff.conflicts));

                logger.info('Detalle de conflictos', {
                    tags:      tagDiff.conflicts.map(i => i.name),
                    triggers:  triggerDiff.conflicts.map(i => i.name),
                    variables: variableDiff.conflicts.map(i => i.name)
                });
            }
        }

        // 8. Confirmations
        console.log(chalk.bold.red('\n¡ATENCIÓN! ESTA ACCIÓN MODIFICARÁ EL WORKSPACE.'));
        console.log(chalk.yellow('Nota: Solo se creará un borrador. Un administrador debe publicarlo desde GTM.'));

        // Find selected account (may be auto-selected)
        const selectedAccount = accounts.find(a => (a.path || `accounts/${a.accountId}`) === accountPath) || accounts[0];

        const { confirmName1 } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmName1',
                message: `Para confirmar, escribe el nombre de la cuenta (${chalk.bold(selectedAccount.name)}):`
            }
        ]);
        logger.userInput('confirmName1', confirmName1 === selectedAccount.name ? '[CORRECTO]' : '[INCORRECTO]');

        if (confirmName1 !== selectedAccount.name) {
            logger.warn('Primera confirmación de nombre fallida. Importación cancelada.');
            console.log(chalk.red('\nEl nombre no coincide. Importación cancelada.'));
            return;
        }

        const { confirmName2 } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmName2',
                message: 'Por seguridad, escríbelo una vez más:'
            }
        ]);
        logger.userInput('confirmName2', confirmName2 === selectedAccount.name ? '[CORRECTO]' : '[INCORRECTO]');

        if (confirmName2 !== selectedAccount.name) {
            logger.warn('Segunda confirmación de nombre fallida. Importación cancelada.');
            console.log(chalk.red('\nEl nombre no coincide. Importación cancelada.'));
            return;
        }

        const { finalConfirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'finalConfirm',
                message: `¿Estás completamente seguro de aplicar los cambios en el workspace "${workspace.name}"?`,
                default: false
            }
        ]);
        logger.userInput('finalConfirm', finalConfirm);

        if (finalConfirm) {
            logger.event('IMPORT_START', { workspace: workspace.path, importMode, conflictStrategy });
            console.log(chalk.blue('\nImportando cambios al workspace (Borrador)...'));
            await gtm.importContainer(workspace.path, containerConfig, importMode, conflictStrategy);
            logger.event('IMPORT_SUCCESS', { workspace: workspace.path });
            console.log(chalk.bold.green('\n¡Éxito! Los cambios se han importado correctamente como un borrador.'));
            console.log(chalk.cyan('Un administrador debe revisar y publicar los cambios desde la consola de GTM.'));
        } else {
            logger.event('IMPORT_CANCELLED_BY_USER');
            console.log(chalk.yellow('\nImportación cancelada.'));
        }

    } catch (error) {
        logger.error('Error crítico en main():', error.message, error.stack);
        console.error(chalk.red('\nOcurrió un error crítico:'), error.message);
    } finally {
        logger.event('SESSION_END');
    }
}

main();
