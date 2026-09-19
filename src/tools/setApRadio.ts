import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const setApRadioSchema = z.object({
    siteId: z.string().min(1).optional(),
    apMac: z.string().min(1, 'apMac is required').describe('AP MAC address, like AA-BB-CC-DD-EE-FF'),
    band: z.enum(['2g', '5g', '5g2', '6g']).describe('Radio band to change: 2g, 5g (single 5 GHz radio, or 5GHz-1), 5g2 (second 5 GHz radio) or 6g'),
    radioEnable: z.boolean().optional().describe('Enable or disable this radio'),
    channel: z.number().int().min(0).optional().describe("Channel index, 0 = auto. Must be one of the AP's available channels"),
    channelWidth: z
        .number()
        .int()
        .min(2)
        .max(10)
        .optional()
        .describe('Channel width code: 2=20MHz, 3=40MHz, 4=2.4G auto, 5=80MHz, 6=5G auto, 7=160MHz, 8=160/80/40/20, 9=240MHz, 10=320MHz'),
    txPowerLevel: z.number().int().min(0).max(4).optional().describe('Tx power level: 0=low, 1=medium, 2=high, 3=custom, 4=auto'),
    txPower: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Tx power in dBm; applies with txPowerLevel 3 (custom), which is set implicitly when txPowerLevel is omitted'),
});

export function registerSetApRadioTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setApRadio',
        {
            description:
                'Change one radio band of an AP: enable/disable, channel, channel width, tx power. Only the supplied fields are sent. ' +
                'This changes live wireless configuration and can drop every client on that band while the radio reconfigures. ' +
                'Use getApRadios first to read the current values. Whether omitted fields keep their current value is not specified by the Open API.',
            inputSchema: setApRadioSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('setApRadio', async ({ apMac, band, siteId, ...settings }) =>
            toToolResult(await client.setApRadio(apMac, band, settings, siteId))
        )
    );
}
