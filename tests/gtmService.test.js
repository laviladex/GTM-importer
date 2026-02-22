import { jest } from '@jest/globals';
import { GtmService } from '../src/gtmService.js';

describe('GtmService', () => {
    let gtmService;
    let mockTagmanager;

    beforeEach(() => {
        // Mocking the structure of the tagmanager object
        mockTagmanager = {
            accounts: {
                list: jest.fn(),
                containers: {
                    list: jest.fn(),
                    workspaces: {
                        list: jest.fn(),
                        import_container: jest.fn()
                    }
                }
            }
        };

        gtmService = new GtmService({});
        // Injecting the mock
        gtmService.tagmanager = mockTagmanager;
    });

    test('listAccounts should return list of accounts', async () => {
        const mockAccounts = [{ name: 'Account 1', path: 'accounts/1' }];
        mockTagmanager.accounts.list.mockResolvedValue({
            data: { account: mockAccounts }
        });

        const accounts = await gtmService.listAccounts();
        expect(accounts).toEqual(mockAccounts);
        expect(mockTagmanager.accounts.list).toHaveBeenCalled();
    });

    test('listContainers should return list of containers', async () => {
        const mockContainers = [{ name: 'Container 1', path: 'accounts/1/containers/1' }];
        mockTagmanager.accounts.containers.list.mockResolvedValue({
            data: { container: mockContainers }
        });

        const containers = await gtmService.listContainers('accounts/1');
        expect(containers).toEqual(mockContainers);
        expect(mockTagmanager.accounts.containers.list).toHaveBeenCalledWith({ parent: 'accounts/1' });
    });

    test('getDefaultWorkspace should return the Default Workspace', async () => {
        const mockWorkspaces = [
            { name: 'Other', path: 'w/1' },
            { name: 'Default Workspace', path: 'w/2' }
        ];
        mockTagmanager.accounts.containers.workspaces.list.mockResolvedValue({
            data: { workspace: mockWorkspaces }
        });

        const workspace = await gtmService.getDefaultWorkspace('c/1');
        expect(workspace.name).toBe('Default Workspace');
        expect(workspace.path).toBe('w/2');
    });

    test('importContainer should call API with correct parameters', async () => {
        const mockConfig = { tags: [] };
        const mockResponse = { status: 'success' };
        mockTagmanager.accounts.containers.workspaces.import_container.mockResolvedValue({
            data: mockResponse
        });

        const result = await gtmService.importContainer('w/1', mockConfig);
        expect(result).toEqual(mockResponse);
        expect(mockTagmanager.accounts.containers.workspaces.import_container).toHaveBeenCalledWith({
            parent: 'w/1',
            requestBody: {
                containerVersion: mockConfig,
                importMode: 'overwrite'
            }
        });
    });
});
