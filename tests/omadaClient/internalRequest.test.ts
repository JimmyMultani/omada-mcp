import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('InternalRequestHandler', () => {
    let mockAxiosInstance: {
        request: ReturnType<typeof vi.fn>;
    };
    let mockAuthManager: {
        getCsrfToken: ReturnType<typeof vi.fn>;
        getSessionCookie: ReturnType<typeof vi.fn>;
        clearSession: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockAxiosInstance = {
            request: vi.fn(),
        };

        mockAuthManager = {
            getCsrfToken: vi.fn().mockResolvedValue('test-csrf-token'),
            getSessionCookie: vi.fn().mockResolvedValue('TPOMADA_SESSIONID=test-session'),
            clearSession: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('get', () => {
        it('should make a GET request against the internal API base path with auth headers', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({
                status: 200,
                data: { errorCode: 0, msg: 'Success', result: { data: [] } },
            });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const result = await handler.get('/sites/site-123/setting/firewall/acls', { currentPage: 1, currentPageSize: 100 });

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    url: '/test-omadac/api/v2/sites/site-123/setting/firewall/acls',
                    params: { currentPage: 1, currentPageSize: 100 },
                    headers: expect.objectContaining({
                        'Csrf-Token': 'test-csrf-token',
                        Cookie: 'TPOMADA_SESSIONID=test-session',
                    }),
                    withCredentials: true,
                })
            );
            expect(result).toEqual({ errorCode: 0, msg: 'Success', result: { data: [] } });
        });
    });

    describe('post', () => {
        it('should make a POST request with the given body', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({ status: 200, data: { errorCode: 0, result: {} } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const body = { name: 'claude-mcp-test' };
            await handler.post('/sites/site-123/setting/firewall/acls', body);

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    url: '/test-omadac/api/v2/sites/site-123/setting/firewall/acls',
                    data: body,
                })
            );
        });
    });

    describe('put', () => {
        it('should make a PUT request with the given body', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({ status: 200, data: { errorCode: 0, result: {} } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const body = { name: 'claude-mcp-test', metric: '5' };
            await handler.put('/sites/site-123/setting/transmission/staticRoutings/route-1', body);

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'PUT',
                    url: '/test-omadac/api/v2/sites/site-123/setting/transmission/staticRoutings/route-1',
                    data: body,
                })
            );
        });
    });

    describe('delete', () => {
        it('should make a DELETE request', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({ status: 200, data: { errorCode: 0, result: {} } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            await handler.delete('/sites/site-123/setting/firewall/acls/acl-1');

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'DELETE',
                    url: '/test-omadac/api/v2/sites/site-123/setting/firewall/acls/acl-1',
                })
            );
        });
    });

    describe('ensureSuccess', () => {
        it('should return the result when errorCode is 0', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');
            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            const result = handler.ensureSuccess({ errorCode: 0, result: { id: 'acl-1' } });

            expect(result).toEqual({ id: 'acl-1' });
        });

        it('should include both the errorCode and message when the controller returns one', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');
            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            expect(() => handler.ensureSuccess({ errorCode: -1, msg: 'Something went wrong' })).toThrow(
                'Internal API request failed (errorCode: -1): Something went wrong'
            );
        });

        it('should still surface the errorCode when the controller returns no message', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');
            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            expect(() => handler.ensureSuccess({ errorCode: -44100 })).toThrow('Internal API request failed (errorCode: -44100)');
        });
    });

    describe('session retry on 401/403', () => {
        it('should clear the session and retry once on a 401 response', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            const axiosError = Object.assign(new Error('Unauthorized'), {
                isAxiosError: true,
                response: { status: 401 },
            });

            mockAxiosInstance.request
                .mockRejectedValueOnce(axiosError)
                .mockResolvedValueOnce({ status: 200, data: { errorCode: 0, result: { data: [] } } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const result = await handler.get('/sites/site-123/setting/firewall/acls');

            expect(mockAuthManager.clearSession).toHaveBeenCalledTimes(1);
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ errorCode: 0, result: { data: [] } });
        });
    });

    describe('session retry on redirect to login or non-API response', () => {
        const loginRedirect = () =>
            Object.assign(new Error('Request failed with status code 302'), {
                isAxiosError: true,
                response: { status: 302, headers: { location: '/test-omadac/login' } },
            });

        it('should not follow redirects, so an expired session is not masked by the login page', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({ status: 200, data: { errorCode: 0, result: {} } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            await handler.get('/sites/site-123/setting/profiles/groups');

            expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({ maxRedirects: 0 }));
        });

        it('should clear the session and retry once on a 302 redirect to the login page', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request
                .mockRejectedValueOnce(loginRedirect())
                .mockResolvedValueOnce({ status: 200, data: { errorCode: 0, result: { data: [] } } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const result = await handler.get('/sites/site-123/setting/profiles/groups');

            expect(mockAuthManager.clearSession).toHaveBeenCalledTimes(1);
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ errorCode: 0, result: { data: [] } });
        });

        it('should surface the redirect target when the redirect persists after re-login', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockRejectedValueOnce(loginRedirect()).mockRejectedValueOnce(loginRedirect());

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            await expect(handler.get('/sites/site-123/setting/profiles/groups')).rejects.toThrow(
                'Internal API request failed: GET /test-omadac/api/v2/sites/site-123/setting/profiles/groups (HTTP 302) (redirected to /test-omadac/login; session likely rejected)'
            );
        });

        it('should clear the session and retry once when the response is not an Omada API envelope', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request
                .mockResolvedValueOnce({ status: 200, headers: { 'content-type': 'text/html' }, data: '<!DOCTYPE html><html></html>' })
                .mockResolvedValueOnce({ status: 200, data: { errorCode: 0, result: { data: [] } } });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');
            const result = await handler.get('/sites/site-123/setting/profiles/groups');

            expect(mockAuthManager.clearSession).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ errorCode: 0, result: { data: [] } });
        });

        it('should report the status, content type, and body when the response is still not an API envelope after re-login', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            mockAxiosInstance.request.mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'text/html;charset=utf-8' },
                data: '<!DOCTYPE html>\n<html lang="">\n</html>',
            });

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            await expect(handler.get('/sites/site-123/setting/profiles/groups')).rejects.toThrow(
                'Internal API request failed: GET /test-omadac/api/v2/sites/site-123/setting/profiles/groups (HTTP 200, text/html;charset=utf-8) - unexpected response with no errorCode, even after re-login: <!DOCTYPE html> <html lang=""> </html>'
            );
            expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
        });
    });

    describe('HTTP-level failures', () => {
        it('should surface the method, endpoint, status, and response message for a non-auth HTTP error', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            const axiosError = Object.assign(new Error('Request failed with status code 500'), {
                isAxiosError: true,
                response: { status: 500, data: { errorCode: -44300, msg: 'Another session is editing this page' } },
            });
            mockAxiosInstance.request.mockRejectedValue(axiosError);

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            await expect(handler.get('/sites/site-123/setting/firewall/acls')).rejects.toThrow(
                'Internal API request failed: GET /test-omadac/api/v2/sites/site-123/setting/firewall/acls (HTTP 500) (errorCode: -44300) - Another session is editing this page'
            );
        });

        it('should fall back to the axios error message when the response body has no msg field', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            const axiosError = Object.assign(new Error('timeout of 30000ms exceeded'), {
                isAxiosError: true,
                response: undefined,
            });
            mockAxiosInstance.request.mockRejectedValue(axiosError);

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            await expect(handler.get('/sites/site-123/setting/firewall/acls')).rejects.toThrow(
                'Internal API request failed: GET /test-omadac/api/v2/sites/site-123/setting/firewall/acls - timeout of 30000ms exceeded'
            );
        });

        it('should rethrow non-axios errors as-is', async () => {
            const { InternalRequestHandler } = await import('../../src/omadaClient/internalRequest.js');

            const plainError = new Error('unexpected failure');
            mockAxiosInstance.request.mockRejectedValue(plainError);

            const handler = new InternalRequestHandler(mockAxiosInstance as never, mockAuthManager as never, 'test-omadac');

            await expect(handler.get('/sites/site-123/setting/firewall/acls')).rejects.toThrow('unexpected failure');
        });
    });
});
