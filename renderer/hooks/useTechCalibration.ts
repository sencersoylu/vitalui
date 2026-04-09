import { useState, useEffect } from 'react';

interface CalibrationData {
	tech_pressure_upper: number;
	tech_pressure_analog: number;
	tech_pressure_offset: number;
	tech_o_upper: number;
	tech_o_analog: number;
	tech_o_offset: number;
}

const DEFAULT_CALIBRATION: CalibrationData = {
	tech_pressure_upper: 0,
	tech_pressure_analog: 0,
	tech_pressure_offset: 0,
	tech_o_upper: 0,
	tech_o_analog: 0,
	tech_o_offset: 0,
};

export function useTechCalibration() {
	const [calibration, setCalibration] = useState<CalibrationData>(DEFAULT_CALIBRATION);

	useEffect(() => {
		fetch('http://192.168.77.100/json.php?i=tech')
			.then((res) => res.json())
			.then((data) => {
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
				}
				setCalibration(cal);
			})
			.catch((err) => {
				console.error('Failed to fetch tech calibration:', err);
			});
	}, []);

	return calibration;
}
