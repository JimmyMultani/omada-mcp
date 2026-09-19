import type { ApRadioBand, ApRadioSettings, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

const AP_RADIO_SETTING_KEYS: Record<ApRadioBand, string> = {
    '2g': 'radioSetting2g',
    '5g': 'radioSetting5g',
    '5g2': 'radioSetting5g2',
    '6g': 'radioSetting6g',
};

/**
 * Device and client action operations for the Omada API.
 * Covers reboot, adopt, block, and unblock actions.
 */
export class ActionOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    /**
     * Reboot a device by MAC address (v1 API).
     */
    public async rebootDevice(deviceMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/${encodeURIComponent(deviceMac)}/reboot`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Adopt a device by MAC address (v1 API).
     */
    public async adoptDevice(deviceMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cmd/adopts`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { macs: [deviceMac] });
        return this.request.ensureSuccess(response);
    }

    /**
     * Block a client by MAC address (v1 API).
     */
    public async blockClient(clientMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/block`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Unblock a client by MAC address (v1 API).
     */
    public async unblockClient(clientMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/unblock`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Reconnect a client by MAC address (v1 API).
     */
    public async reconnectClient(clientMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/reconnect`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Update a client's settings (v1 API).
     */
    public async updateClient(clientMac: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Set device LED setting (v1 API).
     */
    public async setDeviceLed(deviceMac: string, ledSetting: number, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/${encodeURIComponent(deviceMac)}/led-setting`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { ledSetting });
        return this.request.ensureSuccess(response);
    }

    /**
     * Update one radio band of an AP via `PATCH /aps/{apMac}/radio-config` (v1 API).
     *
     * The request body carries only the fields the caller supplied, under the band's
     * `radioSetting*` key. The spec marks every field optional but does not say whether omitted
     * fields keep their current value, so that behaviour is unverified against a live controller.
     * `channel` and `channelWidth` are strings in the API (channel index, `0` = auto; width codes
     * 2=20MHz, 3=40MHz, 4=2.4G auto, 5=80MHz, 6=5G auto, 7=160MHz, 8=160/80/40/20, 9=240MHz, 10=320MHz).
     * `txPower` only applies with `txPowerLevel` 3 (custom), which is set implicitly when omitted.
     * Reconfiguring a radio can drop every client on that band.
     */
    public async setApRadio(apMac: string, band: ApRadioBand, settings: ApRadioSettings, siteId?: string): Promise<unknown> {
        const body: Record<string, unknown> = {};
        if (settings.radioEnable !== undefined) {
            body.radioEnable = settings.radioEnable;
        }
        if (settings.channel !== undefined) {
            body.channel = String(settings.channel);
        }
        if (settings.channelWidth !== undefined) {
            body.channelWidth = String(settings.channelWidth);
        }
        if (settings.txPowerLevel !== undefined) {
            body.txPowerLevel = settings.txPowerLevel;
        }
        if (settings.txPower !== undefined) {
            if (settings.txPowerLevel !== undefined && settings.txPowerLevel !== 3) {
                throw new Error('txPower can only be set with txPowerLevel 3 (custom); omit txPowerLevel or use 3.');
            }
            body.txPower = settings.txPower;
            body.txPowerLevel = 3;
        }
        if (Object.keys(body).length === 0) {
            throw new Error('At least one radio setting (radioEnable, channel, channelWidth, txPowerLevel, txPower) must be provided.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/radio-config`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({
            method: 'PATCH',
            url: path,
            data: { [AP_RADIO_SETTING_KEYS[band]]: body },
        });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get firmware details for a device (v1 API).
     * The Open API spec's path is `/devices/{deviceMac}/latest-firmware-info`, not
     * `/devices/{deviceMac}/firmware` — the latter 404s on every device.
     */
    public async getFirmwareDetails(deviceMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/${encodeURIComponent(deviceMac)}/latest-firmware-info`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Start firmware upgrade for a device (v1 API).
     */
    public async startFirmwareUpgrade(deviceMac: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/${encodeURIComponent(deviceMac)}/firmware/upgrade`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Connect or disconnect a gateway WAN port (v1 API).
     */
    public async setGatewayWanConnect(gatewayMac: string, portId: string, action: 'connect' | 'disconnect', siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/wan/${encodeURIComponent(portId)}/${action}`
        );
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }
}
