/**
 * Linear conversion from raw PLC value to engineering unit.
 * Ported from legacy hboapp linearConversion function.
 */
export function linearConversion(
	lowValue: number,
	highValue: number,
	lowPLC: number,
	highPLC: number,
	value: number,
	fix: number = 1
): number {
	const a = ((lowValue - highValue) / (lowPLC - highPLC)) * 10000;
	const b = lowValue - (lowPLC * a) / 10000;
	const result = (value * a) / 10000 + b;

	if (value < lowPLC) return 0;
	return parseFloat(result.toFixed(fix));
}
