import { api } from './index';

// Alarm Types - Updated according to backend data model
export interface Alarm {
	id: number;
	chamberId: number; // Oda ID (Foreign Key)
	alarmType: string; // 'high_o2', 'low_o2', 'sensor_error', 'calibration_due' (ENUM)
	isActive: boolean; // Is alarm active? (default: true)
	isMuted: boolean; // Is alarm muted? (default: false)
	mutedUntil: string | null; // Susturma bitiş zamanı (nullable)
	triggeredAt: string; // Alarm trigger time (default: NOW)
	resolvedAt: string | null; // Alarm resolution time (nullable)
	o2LevelWhenTriggered: number | null; // O2 level when alarm was triggered (DECIMAL 5,2, nullable)
	createdAt: string;
	updatedAt: string;
}

export interface AlarmStats {
	totalAlarms: number;
	activeAlarms: number;
	resolvedAlarms: number;
	criticalAlarms: number;
	highAlarms: number;
	mediumAlarms: number;
	lowAlarms: number;
}

// Alarm API Functions

// List active alarms
export const getActiveAlarms = async (): Promise<Alarm[]> => {
	try {
		const response = await api.get('/alarms');
		const data = response.data.data || response.data;

		// Eğer response array değilse, boş array döndür
		if (!Array.isArray(data)) {
			console.warn(
				'getActiveAlarms: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Active alarms could not be retrieved:', error);
		throw error;
	}
};

// Get alarm history
export const getAlarmHistory = async (chamberId?: number): Promise<Alarm[]> => {
	try {
		const url = chamberId
			? `/alarms/history?chamberId=${chamberId}`
			: '/alarms/history';
		const response = await api.get(url);
		const data = response.data.data || response.data;

		// Eğer response array değilse, boş array döndür
		if (!Array.isArray(data)) {
			console.warn(
				'getAlarmHistory: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Alarm history could not be retrieved:', error);
		throw error;
	}
};

// Get alarm statistics
export const getAlarmStats = async (): Promise<AlarmStats> => {
	try {
		const response = await api.get('/alarms/stats');
		return response.data.data;
	} catch (error) {
		console.error('Alarm statistics could not be retrieved:', error);
		throw error;
	}
};

// Get alarms for specific chamber
export const getChamberAlarms = async (chamberId: number): Promise<Alarm[]> => {
	try {
		const response = await api.get(`/alarms/${chamberId}`);

		// Backend response formatını kontrol et
		const data = response.data.data || response.data;

		// Eğer response array değilse, boş array döndür
		if (!Array.isArray(data)) {
			console.warn(
				'getChamberAlarms: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Chamber alarms could not be retrieved:', error);
		throw error;
	}
};

// Mute alarm
export const muteAlarm = async (
	chamberId: number,
	duration?: number
): Promise<void> => {
	try {
		const payload = duration ? { duration } : {};
		await api.post(`/alarms/${chamberId}/mute`, payload);
	} catch (error) {
		console.error('Alarm could not be muted:', error);
		throw error;
	}
};

// Resolve alarm
export const resolveAlarm = async (chamberId: number): Promise<void> => {
	try {
		await api.post(`/alarms/${chamberId}/resolve`);
	} catch (error) {
		console.error('Alarm could not be resolved:', error);
		throw error;
	}
};

// Mute all active alarms
export const muteAllAlarms = async (duration?: number): Promise<void> => {
	try {
		const activeAlarms = await getActiveAlarms();
		const mutePromises = activeAlarms.map((alarm) =>
			muteAlarm(alarm.chamberId, duration)
		);
		await Promise.all(mutePromises);
	} catch (error) {
		console.error('All alarms could not be muted:', error);
		throw error;
	}
};

// Mute all active alarms for chamber
export const muteChamberAlarms = async (
	chamberId: number,
	duration?: number
): Promise<void> => {
	try {
		await muteAlarm(chamberId, duration);
	} catch (error) {
		console.error('Chamber alarms could not be muted:', error);
		throw error;
	}
};
