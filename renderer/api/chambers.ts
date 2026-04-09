import { api } from './index';

// Chamber Types - Updated according to backend data model
export interface Chamber {
	id: number;
	name: string; // "Main" or "Entry"
	description: string;
	lastValue: number; // Last read O2 value (DECIMAL 5,2)
	// Calibration data (within Chamber model)
	raw0: number | null; // Raw value for 0% calibration (INTEGER)
	raw21: number | null; // Raw value for 21% calibration (INTEGER)
	raw100: string | null; // Raw value for 100% calibration (TEXT)
	calibrationDate: string; // Last calibration date
	// Alarm levels
	alarmLevelHigh: number; // High alarm level (DECIMAL 5,2, default: 24.0)
	alarmLevelLow: number; // Low alarm level (DECIMAL 5,2, default: 16.0)
	lastSensorChange: string; // Last sensor change date
	isActive: boolean; // Is chamber active? (default: true)
	createdAt: string;
	updatedAt: string;
}

// API Response Types
export interface ChambersResponse {
	success: boolean;
	data: Chamber[];
	count: number;
}

export interface AlarmLevelUpdateResponse {
	success: boolean;
	data: {
		id: number;
		name: string;
		alarmLevelHigh: number;
		alarmLevelLow: number;
	};
	message: string;
}

export interface O2Reading {
	id: number;
	chamberId: number; // Chamber ID (Foreign Key)
	o2Level: number; // Calibrated O2 level (DECIMAL 5,2, 0-100%)
	temperature: number | null; // Temperature (DECIMAL 5,2, -50 to 100°C, nullable)
	humidity: number | null; // Humidity (DECIMAL 5,2, 0-100%, nullable)
	timestamp: string; // Reading timestamp (default: NOW)
	sensorStatus: string; // 'normal', 'warning', 'error' (ENUM)
	createdAt: string;
	updatedAt: string;
}

// Interface representing calibration points
export interface CalibrationPoints {
	raw0: number;
	raw21: number;
	raw100: string;
	calibrationDate: string;
	isCalibrated: boolean;
}

// Chamber API Functions

// Get all chambers
export const getChambers = async (): Promise<Chamber[]> => {
	try {
		const response = await api.get('/chambers');
		const responseData: ChambersResponse = response.data;

		// Check if response has the expected structure
		if (!responseData.success) {
			console.warn('getChambers: API returned success: false');
			return [];
		}

		// If data is not an array, return empty array
		if (!Array.isArray(responseData.data)) {
			console.warn(
				'getChambers: Response data is not an array, returning empty array'
			);
			return [];
		}

		return responseData.data;
	} catch (error) {
		console.error('Failed to fetch chambers:', error);
		throw error;
	}
};

// Get specific chamber
export const getChamber = async (chamberId: number): Promise<Chamber> => {
	try {
		const response = await api.get(`/chambers/${chamberId}`);
		return response.data.data;
	} catch (error) {
		console.error('Failed to fetch chamber:', error);
		throw error;
	}
};

// Create new chamber (usually for testing only - only 2 fixed chambers exist)
export const createChamber = async (
	chamberData: Omit<
		Chamber,
		| 'id'
		| 'createdAt'
		| 'updatedAt'
		| 'lastValue'
		| 'calibrationDate'
		| 'lastSensorChange'
	>
): Promise<Chamber> => {
	try {
		const response = await api.post('/chambers', chamberData);
		return response.data.data;
	} catch (error) {
		console.error('Failed to create chamber:', error);
		throw error;
	}
};

// Update chamber data
export const updateChamber = async (
	chamberId: number,
	chamberData: Partial<Chamber>
): Promise<Chamber> => {
	try {
		const response = await api.put(`/chambers/${chamberId}`, chamberData);
		return response.data.data;
	} catch (error) {
		console.error('Chamber could not be updated:', error);
		throw error;
	}
};

// Delete chamber (usually for testing only - only 2 fixed chambers exist)
export const deleteChamber = async (chamberId: number): Promise<void> => {
	try {
		await api.delete(`/chambers/${chamberId}`);
	} catch (error) {
		console.error('Failed to delete chamber:', error);
		throw error;
	}
};

// Reading Functions

// Get chamber readings
export const getChamberReadings = async (
	chamberId: number
): Promise<O2Reading[]> => {
	try {
		const response = await api.get(`/chambers/${chamberId}/readings`);
		const data = response.data.data || response.data;

		// If response is not an array, return empty array
		if (!Array.isArray(data)) {
			console.warn(
				'getChamberReadings: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Failed to fetch readings:', error);
		throw error;
	}
};

// Get the latest reading
export const getLatestReading = async (
	chamberId: number
): Promise<O2Reading> => {
	try {
		const response = await api.get(`/chambers/${chamberId}/readings/latest`);
		return response.data.data;
	} catch (error) {
		console.error('Latest reading could not be retrieved:', error);
		throw error;
	}
};

// Add new reading (automatic calibration)
export const addReading = async (
	chamberId: number,
	readingData: {
		o2Level: number; // Raw value - calibrated on backend side
		temperature?: number;
		humidity?: number;
		sensorStatus?: string;
	}
): Promise<O2Reading> => {
	try {
		const response = await api.post(`/chambers/${chamberId}/readings`, {
			o2Level: readingData.o2Level,
			temperature: readingData.temperature || null,
			humidity: readingData.humidity || null,
			sensorStatus: readingData.sensorStatus || 'normal',
		});
		return response.data.data;
	} catch (error) {
		console.error('Failed to add reading:', error);
		throw error;
	}
};

// Get reading history
export const getReadingHistory = async (
	chamberId: number,
	startDate?: string,
	endDate?: string
): Promise<O2Reading[]> => {
	try {
		const params = new URLSearchParams();
		if (startDate) params.append('startDate', startDate);
		if (endDate) params.append('endDate', endDate);

		const response = await api.get(
			`/chambers/${chamberId}/readings/history?${params.toString()}`
		);
		const data = response.data.data || response.data;

		// If response is not an array, return empty array
		if (!Array.isArray(data)) {
			console.warn(
				'getReadingHistory: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Failed to fetch reading history:', error);
		throw error;
	}
};

// Alarm Level Functions

// Update alarm level
export const updateAlarmLevel = async (
	chamberId: number,
	alarmLevelHigh: number
): Promise<AlarmLevelUpdateResponse> => {
	try {
		const response = await api.put(`/chambers/${chamberId}/alarm-level`, {
			alarmLevelHigh,
		});
		return response.data;
	} catch (error) {
		console.error('Alarm level could not be updated:', error);
		throw error;
	}
};

// Note: Settings and Calibration functions are now in separate settings.ts file
