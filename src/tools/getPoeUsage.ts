import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPoeUsageTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPoeUsage',
        {
            description:
                'Get live PoE power usage for every PoE switch in a site. Returns per-switch budget (totalPower, W), draw (totalPowerUsed, W), and percent used, plus per-port poeSupported, poeEnabled, poePower (W), and poePercent. Use this for PoE headroom; getSwitch only exposes poeMode per port.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getPoeUsage', async ({ siteId }) => toToolResult(await client.getPoeUsage(siteId)))
    );
}
