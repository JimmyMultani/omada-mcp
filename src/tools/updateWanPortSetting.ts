import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateWanPortSettingSchema = z.object({
    siteId: z.string().min(1).optional(),
    portSetting: z
        .record(z.unknown())
        .describe(
            "WAN port setting object — same shape as one entry in getInternetInfo's wanPortSettings array. " +
                'Full sub-object replace: portId, wanPortIpv4Setting, wanPortIpv6Setting, and wanPortMacSetting are all required together.'
        ),
});

export function registerUpdateWanPortSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateWanPortSetting',
        {
            description:
                "Update a gateway WAN port's connection settings for a site (IPv4/IPv6/MAC config, e.g. the DHCP client's " +
                "unicastDhcp flag). Pass the full port object from getInternetInfo's wanPortSettings array with your changes " +
                'applied — not a narrow partial update. Does not connect/disconnect the port (use setGatewayWanConnect for that).',
            inputSchema: updateWanPortSettingSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateWanPortSetting', async ({ siteId, portSetting }) =>
            toToolResult(await client.updateWanPortSetting(portSetting, siteId))
        )
    );
}
