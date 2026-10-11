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
    /** Power drawn by the port in watts */
    poePower?: number;
    /** Percentage of the switch PoE budget used by the port */
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
    /** Number of ports on the switch */
    portNum: number;
    /** Total PoE power used in watts */
    totalPowerUsed: number;
    /** Percentage of the PoE budget used */
    totalPercentUsed: number;
    /** Total PoE power budget in watts */
    totalPower: number;
    /** Per-port PoE usage */
    poePorts: PoePortUsage[];
}
