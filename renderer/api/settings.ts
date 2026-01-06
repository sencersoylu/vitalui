import { api } from './index';
import { Chamber, CalibrationPoints } from './chambers';

// Settings API Functions - Backend integration prompt'a göre ayrı endpoint'ler

// Get chamber settings
export const getChamberSettings = async (
	chamberId: number
): Promise<Chamber> => {
	try {
		const response = await api.get(`/settings/${chamberId}`);
		return response.data.data;
	} catch (error) {
		console.error('Chamber settings could not be retrieved:', error);
		throw error;
	}
};

// Update chamber settings
export const updateChamberSettings = async (
	chamberId: number,
	settings: Partial<Chamber>
): Promise<Chamber> => {
	try {
		const response = await api.put(`/settings/${chamberId}`, settings);
		return response.data.data;
	} catch (error) {
		console.error('Chamber settings could not be updated:', error);
		throw error;
	}
};

// Get active calibration points (from Chamber data)
export const getActiveCalibrationPoints = async (
	chamberId: number
): Promise<CalibrationPoints> => {
	try {
		const response = await api.get(`/settings/${chamberId}/calibration-points`);
		return response.data.data;
	} catch (error) {
		console.error('Calibration points could not be retrieved:', error);
		throw error;
	}
};

// Ham değeri kalibre et
export const calibrateReading = async (
	chamberId: number,
	rawValue: number
): Promise<{ calibratedValue: number; rawValue: number }> => {
	try {
		const response = await api.post(
			`/settings/${chamberId}/calibrate-reading`,
			{ rawValue }
		);
		return response.data.data;
	} catch (error) {
		console.error('Okuma kalibre edilemedi:', error);
		throw error;
	}
};

// Single point calibration (legacy)
export const calibrateChamber = async (
	chamberId: number,
	calibrationLevel: number
): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/calibrate`, { calibrationLevel });
	} catch (error) {
		console.error('Calibration could not be performed:', error);
		throw error;
	}
};

// Get calibration history
export const getCalibrationHistory = async (
	chamberId: number
): Promise<any[]> => {
	try {
		const response = await api.get(
			`/settings/${chamberId}/calibration-history`
		);
		return response.data.data;
	} catch (error) {
		console.error('Calibration history could not be retrieved:', error);
		throw error;
	}
};

// Check calibration status
export const getCalibrationStatus = async (chamberId: number): Promise<any> => {
	try {
		const response = await api.get(`/settings/${chamberId}/calibration-status`);
		return response.data.data;
	} catch (error) {
		console.error('Calibration status could not be checked:', error);
		throw error;
	}
};

// Mark calibration as required
export const markCalibrationRequired = async (
	chamberId: number
): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/calibration-required`);
	} catch (error) {
		console.error('Calibration could not be marked as required:', error);
		throw error;
	}
};

// Record sensor change
export const recordSensorChange = async (chamberId: number): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/sensor-changed`);
	} catch (error) {
		console.error('Sensor change could not be recorded:', error);
		throw error;
	}
};

// Get calibration statistics
export const getCalibrationStats = async (): Promise<{
	totalChambers: number;
	upToDate: number;
	dueSoon: number;
	overdue: number;
	avgCalibrationInterval: number;
}> => {
	try {
		const response = await api.get('/settings/calibration/stats');
		return response.data.data;
	} catch (error) {
		console.error('Calibration statistics could not be retrieved:', error);
		throw error;
	}
};
