import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    siteId: z.string().min(1).optional(),
    ssid: z
        .record(z.unknown())
        .describe(
            'SSID fields to update, same shape returned by getSsidDetail. This is a full replace: fetch getSsidDetail first, ' +
                'change only the field(s) you want (e.g. set ssidEnable to false to disable the SSID), and pass the complete ' +
                'object back — omitted fields (including pskSetting) will be reset by the controller, not left untouched.'
        ),
});

export function registerUpdateSsidTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsid',
        {
            description:
                'Update an SSID (wireless network) configuration, including enabling/disabling it via ssidEnable. ' +
                'Requires wlanId (from getWlanGroupList) and ssidId (from getSsidList). ' +
                'Fetch getSsidDetail first and pass the full object back with your changes — this is a full replace, not a merge.',
            inputSchema: updateSsidSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsid', async ({ wlanId, ssidId, siteId, ssid }) => toToolResult(await client.updateSsid(wlanId, ssidId, ssid, siteId)))
    );
}
