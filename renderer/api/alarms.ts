import { api } from './index';

// Alarm Types - Backend veri modeline göre güncellendi
export interface Alarm {
	id: number;
	chamberId: number; // Oda ID (Foreign Key)
	alarmType: string; // 'high_o2', 'low_o2', 'sensor_error', 'calibration_due' (ENUM)
	isActive: boolean; // Alarm aktif mi? (default: true)
	isMuted: boolean; // Alarm susturuldu mu? (default: false)
	mutedUntil: string | null; // Susturma bitiş zamanı (nullable)
	triggeredAt: string; // Alarm tetiklenme zamanı (default: NOW)
	resolvedAt: string | null; // Alarm çözülme zamanı (nullable)
	o2LevelWhenTriggered: number | null; // Alarm tetiklendiğindeki O2 seviyesi (DECIMAL 5,2, nullable)
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

// Aktif alarmları listele
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
		console.error('Aktif alarmlar getirilemedi:', error);
		throw error;
	}
};

// Alarm geçmişini getir
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
		console.error('Alarm geçmişi getirilemedi:', error);
		throw error;
	}
};

// Alarm istatistiklerini getir
export const getAlarmStats = async (): Promise<AlarmStats> => {
	try {
		const response = await api.get('/alarms/stats');
		return response.data.data;
	} catch (error) {
		console.error('Alarm istatistikleri getirilemedi:', error);
		throw error;
	}
};

// Belirli odanın alarmlarını getir
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
		console.error('Oda alarmları getirilemedi:', error);
		throw error;
	}
};

// Alarmı sustur
export const muteAlarm = async (
	chamberId: number,
	duration?: number
): Promise<void> => {
	try {
		const payload = duration ? { duration } : {};
		await api.post(`/alarms/${chamberId}/mute`, payload);
	} catch (error) {
		console.error('Alarm susturulamadı:', error);
		throw error;
	}
};

// Alarmı çöz
export const resolveAlarm = async (chamberId: number): Promise<void> => {
	try {
		await api.post(`/alarms/${chamberId}/resolve`);
	} catch (error) {
		console.error('Alarm çözülemedi:', error);
		throw error;
	}
};

// Tüm aktif alarmları sustur
export const muteAllAlarms = async (duration?: number): Promise<void> => {
	try {
		const activeAlarms = await getActiveAlarms();
		const mutePromises = activeAlarms.map((alarm) =>
			muteAlarm(alarm.chamberId, duration)
		);
		await Promise.all(mutePromises);
	} catch (error) {
		console.error('Tüm alarmlar susturulamadı:', error);
		throw error;
	}
};

// Oda için tüm aktif alarmları sustur
export const muteChamberAlarms = async (
	chamberId: number,
	duration?: number
): Promise<void> => {
	try {
		await muteAlarm(chamberId, duration);
	} catch (error) {
		console.error('Oda alarmları susturulamadı:', error);
		throw error;
	}
};
