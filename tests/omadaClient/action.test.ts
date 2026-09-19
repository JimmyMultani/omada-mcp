import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionOperations } from '../../src/omadaClient/action.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('ActionOperations', () => {
    let actionOps: ActionOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string, version?: string) => string;

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            post: vi.fn(),
            request: vi.fn(),
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

        actionOps = new ActionOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getFirmwareDetails', () => {
        it('should fetch firmware details from the latest-firmware-info endpoint', async () => {
            const mockData = { currentVersion: '1.0.0', lastVersion: '1.1.0' };
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: mockData,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await actionOps.getFirmwareDetails('AA-BB-CC-DD-EE-FF', 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/devices/AA-BB-CC-DD-EE-FF/latest-firmware-info');
            expect(result).toEqual(mockData);
        });
    });

    describe('setApRadio', () => {
        const ok: OmadaApiResponse<unknown> = { errorCode: 0, result: null };
        const radioConfigPath = '/openapi/v1/test-omadac/sites/site-1/aps/AA-BB-CC-DD-EE-FF/radio-config';

        beforeEach(() => {
            vi.mocked(mockRequest.request).mockResolvedValue(ok);
        });

        it('should PATCH radio-config with only the supplied fields under the band key, as strings where the API expects them', async () => {
            await actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', { channel: 36, channelWidth: 5 }, 'site-1');

            expect(mockRequest.request).toHaveBeenCalledWith({
                method: 'PATCH',
                url: radioConfigPath,
                data: { radioSetting5g: { channel: '36', channelWidth: '5' } },
            });
        });

        it.each([
            ['2g', 'radioSetting2g'],
            ['5g', 'radioSetting5g'],
            ['5g2', 'radioSetting5g2'],
            ['6g', 'radioSetting6g'],
        ] as const)('should map band %s to %s', async (band, key) => {
            await actionOps.setApRadio('AA-BB-CC-DD-EE-FF', band, { radioEnable: false }, 'site-1');

            expect(mockRequest.request).toHaveBeenCalledWith(expect.objectContaining({ data: { [key]: { radioEnable: false } } }));
        });

        it('should send channel 0 (auto) rather than dropping it as falsy', async () => {
            await actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '2g', { channel: 0 }, 'site-1');

            expect(mockRequest.request).toHaveBeenCalledWith(expect.objectContaining({ data: { radioSetting2g: { channel: '0' } } }));
        });

        it('should imply custom tx power level 3 when txPower is set without a level', async () => {
            await actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', { txPower: 17 }, 'site-1');

            expect(mockRequest.request).toHaveBeenCalledWith(expect.objectContaining({ data: { radioSetting5g: { txPower: 17, txPowerLevel: 3 } } }));
        });

        it('should send a non-custom tx power level on its own', async () => {
            await actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', { txPowerLevel: 4 }, 'site-1');

            expect(mockRequest.request).toHaveBeenCalledWith(expect.objectContaining({ data: { radioSetting5g: { txPowerLevel: 4 } } }));
        });

        it('should reject txPower combined with a non-custom level before calling the API', async () => {
            await expect(actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', { txPower: 17, txPowerLevel: 2 }, 'site-1')).rejects.toThrow(
                'txPowerLevel 3'
            );
            expect(mockRequest.request).not.toHaveBeenCalled();
        });

        it('should reject an empty settings object before calling the API', async () => {
            await expect(actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', {}, 'site-1')).rejects.toThrow('At least one radio setting');
            expect(mockRequest.request).not.toHaveBeenCalled();
        });

        it('should propagate an API error', async () => {
            vi.mocked(mockRequest.request).mockResolvedValue({ errorCode: -39303, msg: 'AP does not exist.' });

            await expect(actionOps.setApRadio('AA-BB-CC-DD-EE-FF', '5g', { channel: 36 }, 'site-1')).rejects.toThrow('AP does not exist.');
        });
    });
});
