/**
 * Dew Point from absolute humidity (water-vapor content in g/m³).
 *
 * Inverse lookup against the saturated-vapor table provided by the project:
 * find the temperature at which saturated water vapor equals the measured
 * absolute humidity. Because saturation vapor grows roughly exponentially
 * with temperature, we interpolate in **log-space** between adjacent table
 * points — that matches the curve far better than plain linear interp.
 */

type Row = readonly [tempC: number, vaporGPerM3: number];

const TABLE: readonly Row[] = [
	[-70, 0.0028],
	[-60, 0.011],
	[-50, 0.038],
	[-40, 0.119],
	[-30, 0.339],
	[-20, 0.884],
	[-10, 2.14],
	[0, 4.85],
	[10, 9.4],
	[20, 17.29],
	[30, 30.35],
	[40, 51.09],
	[50, 82.81],
	[60, 129.73],
	[70, 197.03],
	[80, 290.92],
	[90, 418.61],
	[100, 588.33],
];

/**
 * @param vapor Absolute humidity in g/m³.
 * @returns Dew point in °C, or `null` if the input is invalid or out of
 *          the table's range.
 */
export function dewPointFromAbsHumidity(vapor: number | undefined | null): number | null {
	if (vapor === undefined || vapor === null || !Number.isFinite(vapor)) return null;
	if (vapor <= 0) return null;

	// Clamp to table range — outside this the model isn't meaningful.
	if (vapor <= TABLE[0][1]) return TABLE[0][0];
	if (vapor >= TABLE[TABLE.length - 1][1]) return TABLE[TABLE.length - 1][0];

	for (let i = 0; i < TABLE.length - 1; i++) {
		const [t0, v0] = TABLE[i];
		const [t1, v1] = TABLE[i + 1];
		if (vapor >= v0 && vapor <= v1) {
			// Log-linear interpolation: t = t0 + (t1 - t0) * ln(v/v0) / ln(v1/v0)
			const frac = Math.log(vapor / v0) / Math.log(v1 / v0);
			return t0 + (t1 - t0) * frac;
		}
	}
	return null;
}
