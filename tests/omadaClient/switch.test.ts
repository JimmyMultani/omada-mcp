import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import { SwitchOperations } from '../../src/omadaClient/switch.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('SwitchOperations', () => {
    let switchOps: SwitchOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string, version?: string) => string;

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            fetchPaginated: vi.fn(),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => {
                if (response.errorCode === 0) {
                    return response.result;
                }
                throw new Error(response.msg ?? 'API Error');
            }),
        } as unknown as RequestHandler;

        mockSite = {
            resolveSiteId: vi.fn((siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;

        mockBuildPath = vi.fn((path: string, version = 'v1') => `/openapi/${version}/test-omadac${path}`);

        switchOps = new SwitchOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getSwitchNetworks', () => {
        it('fetches all pages, since the endpoint 400s without page/pageSize', async () => {
            const mockData = [
                { id: 'net1', vlan: 1, name: 'Default' },
                { id: 'net2', vlan: 20, name: 'IoT VLAN' },
            ];

            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await switchOps.getSwitchNetworks('D8-44-89-C3-00-04', 'site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/switches/D8-44-89-C3-00-04/networks');
            expect(mockRequest.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });
    });
});
