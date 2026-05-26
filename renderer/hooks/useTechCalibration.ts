import { useState, useEffect } from 'react';
import { getTechUrl } from '../config';

interface CalibrationData {
	tech_pressure_upper: number;
	tech_pressure_analog: number;
	tech_pressure_offset: number;
	tech_o_upper: number;
	tech_o_analog: number;
	tech_o_offset: number;
	// Main FFS line pressure (legacy sensor name tech_yssp_main / ANAYSS).
	tech_yssp_main_upper: number;
	tech_yssp_main_analog: number;
	tech_yssp_main_offset: number;
	// Ante FFS line pressure (legacy sensor name tech_yssp_entry / ARAYSS).
	tech_yssp_entry_upper: number;
	tech_yssp_entry_analog: number;
	tech_yssp_entry_offset: number;
}

const DEFAULT_CALIBRATION: CalibrationData = {
	tech_pressure_upper: 0,
	tech_pressure_analog: 0,
	tech_pressure_offset: 0,
	tech_o_upper: 0,
	tech_o_analog: 0,
	tech_o_offset: 0,
	tech_yssp_main_upper: 0,
	tech_yssp_main_analog: 0,
	tech_yssp_main_offset: 0,
	tech_yssp_entry_upper: 0,
	tech_yssp_entry_analog: 0,
	tech_yssp_entry_offset: 0,
};

export function useTechCalibration() {
	const [calibration, setCalibration] = useState<CalibrationData>(DEFAULT_CALIBRATION);

	useEffect(() => {
		let cancelled = false;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;

		const attempt = (delayMs: number) => {
			if (cancelled) return;
			fetch(getTechUrl())
				.then((res) => res.json())
				.then((data) => {
					if (cancelled) return;
					if (!data || !Array.isArray(data.users)) throw new Error('bad payload');

					const cal = { ...DEFAULT_CALIBRATION };
					for (const user of data.users) {
						if (user.sensor_name === 'tech_pressure') {
							cal.tech_pressure_upper = Number(user.sensor_upper_value);
							cal.tech_pressure_analog = Number(user.sensor_analog_value);
							cal.tech_pressure_offset = Number(user.offset);
						}
						if (user.sensor_name === 'tech_o') {
							cal.tech_o_upper = Number(user.sensor_upper_value);
							cal.tech_o_analog = Number(user.sensor_analog_value);
							cal.tech_o_offset = Number(user.offset);
						}
						if (user.sensor_name === 'tech_yssp_main') {
							cal.tech_yssp_main_upper = Number(user.sensor_upper_value);
							cal.tech_yssp_main_analog = Number(user.sensor_analog_value);
							cal.tech_yssp_main_offset = Number(user.offset);
						}
						if (user.sensor_name === 'tech_yssp_entry') {
							cal.tech_yssp_entry_upper = Number(user.sensor_upper_value);
							cal.tech_yssp_entry_analog = Number(user.sensor_analog_value);
							cal.tech_yssp_entry_offset = Number(user.offset);
						}
					}

					// If none of the expected sensors came back, treat it as a soft
					// failure and retry — the backend may not have served the tech
					// calibration set yet.
					const gotAny =
						cal.tech_pressure_analog > 0 ||
						cal.tech_o_analog > 0 ||
						cal.tech_yssp_main_analog > 0 ||
						cal.tech_yssp_entry_analog > 0;
					if (!gotAny) throw new Error('empty calibration');

					setCalibration(cal);
				})
				.catch((err) => {
					if (cancelled) return;
					console.warn(`[useTechCalibration] retry in ${delayMs / 1000}s:`, err?.message || err);
					retryTimer = setTimeout(() => attempt(Math.min(delayMs * 2, 30000)), delayMs);
				});
		};

		attempt(2000);

		return () => {
			cancelled = true;
			if (retryTimer) clearTimeout(retryTimer);
		};
	}, []);

	return calibration;
}
