import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import { loadCredentials, authorize } from './auth.js';
import { GtmService } from './gtmService.js';

async function main() {
    console.log(chalk.bold.cyan('\n--- GTM Container Importer ---\n'));

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

        const credentials = await loadCredentials(credentialsPath);
        const auth = await authorize(credentials);
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

        if (!await fs.exists(containerPath)) {
            console.error(chalk.red(`Error: El archivo ${containerPath} no existe.`));
            return;
        }
        const containerConfig = await fs.readJSON(containerPath);

        // 3. List Accounts
        console.log(chalk.yellow('\nBuscando cuentas de GTM...'));
        const accounts = await gtm.listAccounts();
        console.log(chalk.gray(`Se encontraron ${accounts.length} cuenta(s).`));

        if (accounts.length === 0) {
            console.log(chalk.red('No se encontraron cuentas asociadas a estas credenciales.'));
            return;
        }

        let accountPath;
        if (accounts.length === 1) {
            const only = accounts[0];
            accountPath = only.path || `accounts/${only.accountId}`;
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
        }

        if (!accountPath) {
            console.error(chalk.red('\nError: No se pudo determinar una ruta de cuenta válida.'));
            return;
        }

        // 4. List Containers
        console.log(chalk.yellow(`\nBuscando contenedores para: ${accountPath}...`));
        const containers = await gtm.listContainers(accountPath);
        console.log(chalk.gray(`Se encontraron ${containers.length} contenedor(es).`));

        if (!containers || containers.length === 0) {
            console.log(chalk.red('No se encontraron contenedores en esta cuenta.'));
            return;
        }

        let selectedContainerPath;
        if (containers.length === 1) {
            const only = containers[0];
            selectedContainerPath = only.path;
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
        }

        if (!selectedContainerPath) {
            console.error(chalk.red('\nError: No se pudo determinar una ruta de contenedor válida.'));
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

        let workspace;
        if (createNew) {
            console.log(chalk.yellow(`\nCreando nuevo workspace: ${newWorkspaceName}...`));
            workspace = await gtm.createWorkspace(selectedContainerPath, newWorkspaceName);
            console.log(chalk.green(`Workspace creado: ${workspace.name}`));
        } else {
            workspace = await gtm.getDefaultWorkspace(selectedContainerPath);
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
            console.log(chalk.gray(`  Estrategia de conflictos: ${chalk.bold(conflictStrategy)}`));
        }

        // 7. Analyze diff (now contextualized with the chosen mode)
        console.log(chalk.yellow('\nAnalizando diferencias y posibles impactos...'));

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
            if (showDetails) {
                const names = list => list.map(i => i.name).join(', ');
                if (tagDiff.conflicts.length > 0)      console.log(chalk.yellow('\nConflictos Tags:'),      names(tagDiff.conflicts));
                if (triggerDiff.conflicts.length > 0)  console.log(chalk.yellow('Conflictos Triggers:'),  names(triggerDiff.conflicts));
                if (variableDiff.conflicts.length > 0) console.log(chalk.yellow('Conflictos Variables:'), names(variableDiff.conflicts));
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
        if (confirmName1 !== selectedAccount.name) {
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
        if (confirmName2 !== selectedAccount.name) {
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

        if (finalConfirm) {
            console.log(chalk.blue('\nImportando cambios al workspace (Borrador)...'));
            await gtm.importContainer(workspace.path, containerConfig, importMode, conflictStrategy);
            console.log(chalk.bold.green('\n¡Éxito! Los cambios se han importado correctamente como un borrador.'));
            console.log(chalk.cyan('Un administrador debe revisar y publicar los cambios desde la consola de GTM.'));
        } else {
            console.log(chalk.yellow('\nImportación cancelada.'));
        }

    } catch (error) {
        console.error(chalk.red('\nOcurrió un error crítico:'), error.message);
    }
}

main();
