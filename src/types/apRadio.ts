/**
 * AP radio band. `5g` is the single 5 GHz radio (or 5GHz-1 on tri-band APs), `5g2` the second 5 GHz radio.
 */
export type ApRadioBand = '2g' | '5g' | '5g2' | '6g';

/**
 * Settings that setApRadio can change on one radio band. Every field is optional; only supplied fields are sent.
 */
export interface ApRadioSettings {
    /** Enable or disable the radio */
    radioEnable?: boolean;

    /** Channel index; 0 = auto. Must be one of the AP's available channels */
    channel?: number;

    /** Channel width code: 2=20MHz, 3=40MHz, 4=2.4G auto, 5=80MHz, 6=5G auto, 7=160MHz, 8=160/80/40/20, 9=240MHz, 10=320MHz */
    channelWidth?: number;

    /** Tx power level: 0=low, 1=medium, 2=high, 3=custom, 4=auto */
    txPowerLevel?: number;

    /** Tx power in dBm; applies with txPowerLevel 3 (custom), which is implied when txPowerLevel is omitted */
    txPower?: number;
}
