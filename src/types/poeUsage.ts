/**
 * PoE usage for a single port on a PoE switch (dashboard endpoint).
 * poeEnabled, poePower, and poePercent are only present when poeSupported is true.
 */
export interface PoePortUsage {
    /** Switch port ID */
    portId: number;
    /** Whether the port supports PoE */
    poeSupported: boolean;
    /** Whether PoE is enabled on the port */
    poeEnabled?: boolean;
    /** Power drawn by the port in whole watts */
    poePower?: number;
    /** Percentage of the port's own maximum (e.g. 30 W for 802.3at), not of the switch budget */
    poePercent?: number;
}

/**
 * PoE usage for a PoE switch (dashboard endpoint).
 */
export interface PoeUsage {
    /** Switch MAC address */
    mac: string;
    /** Switch name */
    name: string;
    /** Number of PoE-capable ports (4 on an 8-port SG2008P), not the total port count */
    portNum: number;
    /** Total PoE power used in whole watts */
    totalPowerUsed: number;
    /** Percentage of the PoE budget used, computed from unrounded power, so it can be fractional */
    totalPercentUsed: number;
    /** Total PoE power budget in watts */
    totalPower: number;
    /** Per-port PoE usage */
    poePorts: PoePortUsage[];
}
