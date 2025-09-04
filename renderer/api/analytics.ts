import { api } from './index';

// Analytics Types
export interface DashboardData {
	totalChambers: number;
	activeChambers: number;
	totalAlarms: number;
	activeAlarms: number;
	averageO2Level: number;
	lastUpdate: string;
	chambers: {
		id: number;
		name: string;
		o2Level: number;
		status: string;
		lastReading: string;
	}[];
}

export interface O2Trend {
	chamberId: number;
	chamberName: string;
	trends: {
		timestamp: string;
		o2Level: number;
		temperature: number;
		humidity: number;
	}[];
}

export interface CalibrationReport {
	chamberId: number;
	chamberName: string;
	lastCalibration: string;
	nextDue: string;
	calibrationHistory: {
		date: string;
		level: number;
		performedBy: string;
	}[];
	status: 'up_to_date' | 'due_soon' | 'overdue';
}

export interface AlarmSummary {
	period: string;
	totalAlarms: number;
	alarmsByType: {
		low_o2: number;
		high_o2: number;
		sensor_error: number;
		calibration_needed: number;
	};
	alarmsBySeverity: {
		low: number;
		medium: number;
		high: number;
		critical: number;
	};
	alarmsByChamberId: {
		[chamberId: string]: number;
	};
	avgResolutionTime: number; // minutes
}

// Analytics API Functions

// Dashboard verilerini getir
export const getDashboardData = async (): Promise<DashboardData> => {
	try {
		const response = await api.get('/analytics/dashboard');
		return response.data.data;
	} catch (error) {
		console.error('Dashboard verileri getirilemedi:', error);
		throw error;
	}
};

// O2 trendlerini getir
export const getO2Trends = async (
	chamberId?: number,
	startDate?: string,
	endDate?: string
): Promise<O2Trend[]> => {
	try {
		const params = new URLSearchParams();
		if (chamberId) params.append('chamberId', chamberId.toString());
		if (startDate) params.append('startDate', startDate);
		if (endDate) params.append('endDate', endDate);

		const response = await api.get(`/analytics/trends?${params.toString()}`);
		return response.data.data;
	} catch (error) {
		console.error('O2 trendleri getirilemedi:', error);
		throw error;
	}
};

// Kalibrasyon raporlarını getir
export const getCalibrationReports = async (
	chamberId?: number
): Promise<CalibrationReport[]> => {
	try {
		const url = chamberId
			? `/analytics/reports/calibration-history?chamberId=${chamberId}`
			: '/analytics/reports/calibration-history';
		const response = await api.get(url);
		return response.data.data;
	} catch (error) {
		console.error('Kalibrasyon raporları getirilemedi:', error);
		throw error;
	}
};

// Alarm özet raporlarını getir
export const getAlarmSummary = async (
	startDate?: string,
	endDate?: string,
	chamberId?: number
): Promise<AlarmSummary> => {
	try {
		const params = new URLSearchParams();
		if (startDate) params.append('startDate', startDate);
		if (endDate) params.append('endDate', endDate);
		if (chamberId) params.append('chamberId', chamberId.toString());

		const response = await api.get(
			`/analytics/reports/alarm-summary?${params.toString()}`
		);
		return response.data.data;
	} catch (error) {
		console.error('Alarm özet raporları getirilemedi:', error);
		throw error;
	}
};

// Kalibrasyon istatistiklerini getir
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
		console.error('Kalibrasyon istatistikleri getirilemedi:', error);
		throw error;
	}
};
